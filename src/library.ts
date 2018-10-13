/*
import { Person } from "./Models/person"
import { PerfType, DisplayType } from "./Models/models"
import { MAX_TIME } from "./Models/const"

export class Library {

       

		private	static _Library: Library;

		public	selectedPerson: Person | null;
		private _people: Person[];         // List of all people in the database
		private _bias: number;			 // How strongly to bias toward unknown faces
		private _binTotalPhoto: number;  // Bin size from which to choose next trial
        private _binTotalName: number;   // Bin size from which to choose next trial
        private _binTotalDesc: number;   // Bin size from which to choose next trial
        private _sortType: PerfType     // Current sort type
        private _keywordFilters: string[];  // Filter test items by these keywords
        private _selectedPeople: Person[]; // List of people after applying test type and keyword filters
        private _needSort: boolean;       // True when a sort needs to happen
    //    private Dictionary<string, Keyword> _keywordDic;
    //    private _isRegistered: boolean;   // Is this a registered copy?
        private _displayMode: DisplayType  
        private _includeArchived: boolean;
        
    constructor() {
            this.selectedPerson = null
            this._people		 = []
            //this._selectedPeople = [];
            //this._keywordDic     = new Dictionary<string,Keyword>();
            this._needSort = true
			this._bias		    = 5
			this._binTotalPhoto	= 0
            this._binTotalName  = 0
            this._binTotalDesc  = 0
            this._sortType = PerfType.ALPHA
            this._keywordFilters =  []
            this._selectedPeople = []
            this._needSort = false
            this._includeArchived = false
            //this._isRegistered  = Register.IsRegistered();
            this._displayMode   = DisplayType.TEST;
    }

    static get SortType(): PerfType {
        return this._Library._sortType;
    }

    static set SortType(value: PerfType) {
        if (this._Library._sortType != value)
        {
            this._Library._sortType = value;
            this._Library._needSort = true;
        }
    }

    static InitLibrary() : void
    {
        this._Library = new Library();

        // Default to sorting alphabetically
       // Lars done in contstrutor - remove this._sortType = PerfType.ALPHA;
        Library.SortPeople();

        // Select first person
        if ( this._Library._people.length > 0)
        {
            this._Library.selectedPerson = this._Library._people[0];
        }

    }

    /// <summary>
    /// Returns list of people in the library, filtered by test settings
    /// </summary>
    /// <returns></returns>
    static SelectedPeople(): Person[]
    {
        // TODO: add need sort flag and only sort when needed
        if (this._Library._needSort == true)
        {
            Library.SortPeople();
        }

        return this._Library._selectedPeople;
    }

    static SetIncludeArchive(value: boolean): void
    {
        this._Library._includeArchived = value;
        this._Library._needSort = true;
    }

    /// <summary>
    /// Returns size of library
    /// </summary>
    /// <returns></returns>
    static LibrarySize(): number
    {
        return this._Library._people.length;
    }

    static SetSelected(curPerson: Person): void
    {
         this._Library.selectedPerson = curPerson;
    }

    static GetSelected(): Person|null
		{
			return this._Library.selectedPerson;
        }
        
    static SelectFirst(): void
    {
        if (this._Library._selectedPeople.length > 0)
        {
            this._Library.selectedPerson = this._Library._selectedPeople[0];
        }
        else
        {
            this._Library.selectedPerson = null;
        }
    }

    /// <summary>
    /// Select best person to study
    /// </summary>
    /// <returns></returns>
    static SelectBest(): boolean
    {
        if (this._Library._selectedPeople.length == 1)
        {
            Library.SetSelected(this._Library._selectedPeople[0]);
        }
        else if (this._Library._selectedPeople.length > 0)
        {
            let newPerson: Person | null = null;

            while (newPerson == null)
            {
                // Find a random person to test
                newPerson = this.GetRandomPerson();

                // See if we failed to find someone
                if (newPerson == null)
                {
                    return false;
                }

                // Don't immediately repeat the last one
                if (newPerson == Library.GetSelected())
                {
                    newPerson = null;
                }
            }

            if (newPerson != null) 
            {
                Library.SetSelected(newPerson);
            }
        }
        return true;
    }

    /// <summary>
    /// Returns number of people in library valid for the given test type
    /// with the current active filter
    /// </summary>
    /// <param name="testType"></param>
    /// <returns></returns>
    static NumValidPeople(testType: PerfType): number
    {
        let count = 0;
        this._Library._people.forEach(person =>
        {
            if (Library.PersonMatchesFilter(person) && Library.PersonMatchesTestType(person,testType))
            {
                count++;
            }
        })
        return count;
    }

    /// <summary>
    /// Returns true is the given person has the appropriate data 
    /// to be included in current library's test type
    /// </summary>
    /// <returns></returns>
    // LARS - why the indirection, just call one below
/*    static PersonMatchesTestType(person: Person): boolean
    {
        return this.PersonMatchesTestType(person, SortType);
    }*/
/*
/// <summary>
    /// Returns true is the given person has the appropriate data 
    /// to be included in the given test type
    /// </summary>
    /// <returns></returns>
    static PersonMatchesTestType(person: Person, testType: PerfType): boolean
    {
        // Excluce people that don't have data for test type
        switch (testType)
        {
            case PerfType.PHOTO:
                return (person.NumPhotos() > 0);
            case PerfType.NAME:
                return (person.FullName != "");
            case PerfType.DESC:
                return (person.Description != "");
            case PerfType.ALPHA:
                return true;
        }
        return false;
    }

    
    /// <summary>
    /// Returns true if the given person matches the current keyword filter
    /// </summary>
    /// <returns></returns>
    static PersonMatchesFilter(person: Person): boolean
    {
        if (person.IsArchived)
        {
            // Never include archived people in tests
            if (this._Library._displayMode == DisplayType.TEST) return false;

            // Only include archived people if requested
            if (this._Library._includeArchived == false) return false;

        }
        // Make sure person has all the requested keywords
        return person.HasKeywords(this._Library._keywordFilters);
    }

    static SetDisplayMode(displayMode: DisplayType): void
    {
        this._Library._displayMode = displayMode;
    }

    /// <summary>
    /// Pick a random person from the test set based on testing frequency
    /// </summary>
    /// <returns></returns>
    static GetRandomPerson(): Person|null
    {
        // Picks a random person weighted by their frequency
        Random RandomClass = new Random();
        let randInt = RandomClass.Next(Library.FreqTotal(SortType));
        
        this._Library._selectedPeople.forEach(person =>
        {
            if (randInt < person.FrequencyOffset(SortType))
            {
                if (this.PersonMatchesFilter(person) && this.PersonMatchesTestType(person, this.SortType))
                {
                   //LARS todo  Logger.Log(randInt.ToString() + ":" + person.AvgTime(SortType) + " " + person.FrequencyOffsetString(SortType) + " " + person.FullName);
                    return person;
                }
            }
        })
        return null;
    }

    static PersonExists(newPerson: Person): Person | null
    {
        this._Library._people.forEach(person =>
        {
            if (person.MyGuid == newPerson.MyGuid)
            {
                return person;
            }
            else if (person.FullName.toLocaleLowerCase == newPerson.FullName.toLocaleLowerCase)
            {
                return person;
            }
            else if (person.GetInfoUrl(InfoType.FACEBOOK) == newPerson.GetInfoUrl(InfoType.FACEBOOK))
            {
                return person;
            }
        })
        return null;
    }

    static NameExists(firstName: string, lastName: string): boolean
    {
        this. _Library._people.forEach(person =>
        {
            if (person.FirstName == firstName && person.LastName == lastName)
            {
                return true;
            }
        })
        return false;
    }

/// <summary>
    /// Returns a list of people with similar names
    /// </summary>
    /// <param name="firstName"></param>
    /// <param name="lastName"></param>
    /// <returns></returns>
    static SimilarPeople(person: Person): Person[]
    {
        let similarPeople: Person[] = []

        this._Library._people.forEach(checkPerson =>
        {
            let simScore = StringDiff.GetSimilarity(person.FullName, checkPerson.FullName);
            if (simScore > 0.8)
            {
                similarPeople.push(checkPerson);
            }
        })
        return similarPeople;
    }

    /// <summary>
    /// Sorts people by current sort type and recalcualtes frequences and bin size
    /// </summary>
    static SortPeople(): void
    {
        // Reset flag indicating that a sort is needed
        this._Library._needSort = false;

        // Reset selected people list
        this._Library._selectedPeople = []

        // Check if there are no people
        if (this._Library._people.length == 0)
        {
            return;
        }

        //---------------------------------------------------------
        // Create selected list filtered by test type and keywords
        //---------------------------------------------------------
        this._Library._people.forEach (person =>
        {
            if (this.PersonMatchesFilter(person))
            {
                // If displaying all add it to list
                if (this._Library._displayMode == DisplayType.ALL)
                {
                    this._Library._selectedPeople.push(person);
                }
                // Otherwise only display if matchs
                else if (this.PersonMatchesTestType(person, this.SortType))
                {
                    this._Library._selectedPeople.push(person);
                }
            }
        })

        // Make sure there were people
        if (this._Library._selectedPeople.length == 0) return;

        // Sort people in avg duration order
        let peopleL = this._Library._selectedPeople;
        peopleL.Sort();

        //-------------------------------------------
        // Now weight them for appearance in testing
        //-------------------------------------------

        // Find longest and shortest times
        let largestTime  = 0;
        let smallestTime = MAX_TIME
        peopleL.forEach (person =>
        {
            // Only for people with at least one presentation
            if (person.NumPresentations(Library.SortType) > 0)
            {
                if (person.AvgTime(Library.SortType) > largestTime) 
                {
                    largestTime = person.AvgTime(Library.SortType);
                }
                if (person.AvgTime(Library.SortType) < smallestTime)
                {
                    smallestTime = person.AvgTime(Library.SortType);
                }
            }
        })
        // If very first test set all frequencies to 1
        if (largestTime == 0) 
        {
            peopleL.forEach (person =>
            {
                if (this.PersonMatchesTestType(person, Library.SortType))
                {
                    person.SetFrequency(Library.SortType, 1);
                }
                else
                {
                    person.SetFrequency(Library.SortType, 0);
                }
            })
        }
        // Caculate the frequency for each
        else
        {	
            peopleL.forEach (person =>
            {
                // If person not valid for test type use zero
                if (!this.PersonMatchesTestType(person, Library.SortType))
                {
                    person.SetFrequency(Library.SortType, 0);
                }
                // If a new person, use largest time
                else if (person.NumPresentations(Library.SortType) == 0)
                {
                    person.SetFrequency(Library.SortType, (int)Math.Ceiling(1 + (this._Library._bias * ((largestTime / smallestTime) - 1))));
                }
                    // Otherwise use average time
                else
                {
                    // Get average time take to respond
                    let avgTime = person.AvgTime(Library.SortType);

                    // Add time based on how long since last tested - max time after 30 days
                    let ageBias = person.AgeBias(Library.SortType);
                    
                    // Limit to max time
                    avgTime = Math.Min(MAX_TIME,(avgTime+ageBias));

                    // Calculate how often this person should appear
                    let frequency = (int)Math.Ceiling(1 + (this._Library._bias * ((avgTime / smallestTime) - 1)));

                    person.SetFrequency(SortType, frequency);
                }
            })
        }

        // Now give each person a range depending on the frequency
        this._Library.BinTotal = 0;

        console.log("--------" + Library.SortType + "--------");

        let minAverage = Library.ShortestAvgTime();//<<TODO>> - probably wrong list! selected!
        let maxAverage = Library.LongestAvgTime();

        peopleL.forEach(person =>
        {
            person.SetFrequencyOffset(SortType, this._Library.BinTotal + person.Frequency(SortType));
            person.SetRank(SortType, this._Library._selectedPeople.IndexOf(person));
            person.SetFamiliarity(SortType, minAverage, maxAverage, person.AvgTime(SortType));
            this._Library.BinTotal += person.Frequency(SortType);

            console.log((person.AvgTime(SortType)+" " + person.FrequencyOffsetString(SortType)+" "+person.FullName));
        })
    }


    public get BinTotal() : number
    {
        switch (Library.SortType)
        {
            case PerfType.PHOTO:
                return this._binTotalPhoto;
            case PerfType.NAME:
                return this._binTotalName;
            case PerfType.DESC:
                return this._binTotalDesc;
        }
        return -1
    }  

    public set BinTotal(value: number) : void
    {
        switch (Library.SortType)
        {
            case PerfType.PHOTO:
                this._binTotalPhoto = value;
                break;
            case PerfType.NAME:
                this._binTotalName = value;
                break;
            case PerfType.DESC:
                this._binTotalDesc = value;
                break;
        }
    }
}
/*
    

	/// <summary>
	/// Summary description for Library.
	/// </summary>
	public class Library
	{
	


		//================================================================
		// > InitLibrary
		//================================================================
		

	

    

       


        

		

		
        
     

        


        
		


    

        

        /// <summary>
        /// Create a new person with the given first and last name, add them
        /// to the library and create appropriate directory on disk
        /// </summary>
        /// <param name="firstName"></param>
        /// <param name="lastName"></param>
        /// <returns></returns>
		static public Person AddPerson(string firstName, string lastName)
		{
			Person newPerson = new Person();
			newPerson.FirstName = firstName;
			newPerson.LastName	= lastName;
			newPerson.Save();
			_Library._people.Add(newPerson);
            _Library._needSort = true;
			Library.SetSelected(newPerson);
			
			return newPerson;
		}

        /// <summary>
        /// Given an existing person on disk, add them to the library
        /// </summary>
        /// <param name="newPerson"></param>
        /// <returns></returns>
        static public Person AddPerson(Person newPerson)
        {
            _Library._people.Add(newPerson);
            _Library._needSort = true;
            Library.SetSelected(newPerson);
            return newPerson;
        }

        static public Person FindByGUID(string guid)
        {
            foreach (Person person in _Library._people)
            {
                if (person.MyGuid == guid)
                {
                    return person;
                }
            }
            return null;
        }
        
		static public Person FindByName(string nameString)
		{
			foreach (Person person in _Library._people)
			{
				if (person.FullName.ToLower().StartsWith(nameString.ToLower()))
				{
					return person;
				}
			}
			return null;
		}

		static public void RenamePerson(string firstName, string lastName, string nickName, string maidenName)
		{
			Person curPerson = _Library.selectedPerson;
            curPerson.RenamePerson(firstName, lastName, nickName, maidenName);
		}

        /// <summary>
        /// Deletes the currently selected person and all their data and photos
        /// </summary>
        static public void DeleteSelected()
        {
            // Find path to person's directory and delte the directory
            Person curPerson = _Library.selectedPerson;
            if (curPerson == null) return;

            string pathName = curPerson.DirName;

            if (!Directory.Exists(pathName))
            {
                System.Windows.Forms.MessageBox.Show("Attempting to delete a person that isn't in the database!");
                return;
            }
            Directory.Delete(pathName,true);

            // Remove person from library
            int oldIndex = _Library._people.IndexOf(curPerson);
            _Library._people.Remove(curPerson);

            // Set to previous person
            oldIndex--;
            if (oldIndex < 0) oldIndex = 0;

            if (_Library._people.Count > 0)
            {
                _Library.selectedPerson = (Person)_Library._people[0];
            }
            else
            {
                _Library.selectedPerson = null;
            }
            
            // Need to resort
            _Library._needSort = true; 
        }

        /// <summary>
        /// Archive the selected person
        /// </summary>
        static public void ToggleArchiveSelected()
        {
            // Find path to person's directory and delte the directory
            Person curPerson = _Library.selectedPerson;
            if (curPerson == null) return;

            curPerson.IsArchived = !curPerson.IsArchived;

            // Need to resort
            _Library._needSort = true;
        }

        /// <summary>
        /// Returns longest average time for the current SortType
        /// </summary>
        static public long LongestAvgTime()
        {
            // Find first person with valid test type, it will
            // have the longest time
            foreach (Person person in _Library._selectedPeople)
            {
                if (PersonMatchesTestType(person))
                {
                    return person.AvgTime(SortType);
                }
            }
            return Library.maxTime;
         }

 
        // Force a reset of selected people
        static public void ForceResort()
        {
            _Library._needSort = true;
        }

        
        /// <summary>
        /// Load keywords from file
        /// </summary>
        static public void AddKeyword(string keyword)
        {
            Keyword myKeyword = null;
            bool hasKeyword = _Library._keywordDic.TryGetValue(keyword,out myKeyword);

            // If already has keyword add count
            if (hasKeyword)
            {
                myKeyword.AddUse();
            }
            else
            {
                Keyword newKeyword = new Keyword(keyword);
                _Library._keywordDic.Add(keyword, newKeyword);
            }
        }

        /// <summary>
        /// Keep track of used fields
        /// </summary>
        static public void AddField(string keyword)
        {
            Keyword myKeyword = null;
            bool hasKeyword = _Library._keywordDic.TryGetValue(keyword, out myKeyword);

            // If already has keyword add count
            if (hasKeyword)
            {
                myKeyword.AddUse();
            }
            else
            {
                Keyword newKeyword = new Keyword(keyword);
                _Library._keywordDic.Add(keyword, newKeyword);
            }
        }
		/// <summary>
		/// Load the library of people
		/// </summary>
		/// <returns></returns>
		static public void LoadLibrary(LoadWait loadWait)
		{
			// Find number of directories
			DirectoryInfo docDir = new DirectoryInfo(Options.LibraryDirectory);
			if (docDir.Exists)
			{
				System.IO.DirectoryInfo[] foundDirs = docDir.GetDirectories();

				//---------------------------------------------------
				// Load data
                DirectoryInfo[] dirs = docDir.GetDirectories();

                List<string> dirList = new List<string>();

                // Make list of directories
                foreach (DirectoryInfo dir in dirs)
                {
                    DirectoryInfo docSubDir = new DirectoryInfo(dir.FullName);
                    DirectoryInfo[] subdirs = docSubDir.GetDirectories();

                    foreach (DirectoryInfo subdir in subdirs)
                    {
                        dirList.Add(subdir.FullName);
                    }
                }

                // Limit num loaded items by registration
                int numDirs = dirList.Count;
                if (!Library.IsRegistered && numDirs > 20)
                {
                    RegisterWarning rWarning = new RegisterWarning();
                    rWarning.StartPosition = FormStartPosition.CenterParent;
                    rWarning.ShowDialog();
                    // If still not registered, throttle to 20
                    if (!Library.IsRegistered)
                    {
                        numDirs = 20;
                    }
                }

                // Now load them
                loadWait.InitProgress(dirList.Count);
                for (int i=0;i<numDirs;i++)
                {
                   Person newPerson = new Person();
                   newPerson.Load(dirList[i]);
                   _Library._people.Add(newPerson);
                   loadWait.SetProgress(i);
               }

           
				// Set to first person
				if (_Library._people.Count > 0)
				{
					_Library.selectedPerson = (Person)_Library._people[0];
				}
			}
		}

		static public int FreqTotal(PerfType perfType)
		{
            switch (perfType)
            {
                case PerfType.PHOTO:
                    return _Library._binTotalPhoto;
                case PerfType.NAME:
                    return _Library._binTotalName;
                case PerfType.DESC:
                    return _Library._binTotalDesc;
                case PerfType.ALPHA:
                    System.Windows.Forms.MessageBox.Show("ERROR: PerfType.APLHA in FreqTotal.");//<<TODO>> add standard error definitions
                    return 0;
            }
            return -1;
		}

		

        static public Dictionary<string,Keyword> KeywordList
        {
            get { return _Library._keywordDic; } 
        }

        static public void ClearTestFilter()
        {
            _Library._keywordFilters = new List<string>();
            _Library._needSort = true;
        }

        static public void AddTestFilter(string keyword)
        {
            if (!_Library._keywordFilters.Contains(keyword))
            {
                _Library._keywordFilters.Add(keyword);
                _Library._needSort = true;
            }
        }

        /// <summary>
        /// Returns list of keyword filters
        /// </summary>
        /// <returns>List<string></string></returns>
        static public List<string> GetTestFilters()
        {
            return _Library._keywordFilters;
        }

		public int Bias
		{
			get { return _bias;  }
			set { _bias = value; }
		}

        static public void RegisterPeekaboo(string regID)
        {
            Register.SaveUserRegistry(regID);
            _Library._isRegistered = Register.IsRegistered();
        }

        static public bool IsRegistered
        {
            get { return _Library._isRegistered; }
        }

        static public void ExportLibrary(string saveFN)
        {
            FastZip fz = new FastZip();
            fz.CreateZip(saveFN, Options.LibraryDirectory, true,"");
        }


        /// <summary>
        ///  Unzip library and report back number of found directories
        /// </summary>
        /// <param name="importFN"></param>
        static public int ImportLibrary(string importFN)
        {
            FastZip fz = new FastZip();
            string tempFN = Options.ImportDirectory;
            fz.ExtractZip(importFN, tempFN, "");

            DirectoryInfo docDir = new DirectoryInfo(tempFN);
            if (docDir.Exists)
            {
                return docDir.GetDirectories().Length;
            }
            else
            {
                return 0;
            }
        }


        /// <summary>
        /// Given a CSV header line and header name, return the column number or null
        /// </summary>
        /// <param name="header"></param>
        /// <param name="columnName"></param>
        /// <returns></returns>
        static private int GetCSVColumnNum(string header, string columnName)
        {
            string[] columns = header.Split(new char[] { ',' });
            for (int i=0;i<columns.Length;i++)
            {
                string curHeader = (string)columns[i];
                if (curHeader.ToLower() == columnName.ToLower())
                {
                    return i;
                }
            }
            return -1;
        }

        static private string FirstNameFromFullName(string fullName)
        {
            string[] names = fullName.Split(new char[] { ' ' });
            return names[0];
        }

        static private string LastNameFromFullName(string fullName)
        {
            string[] names = fullName.Split(new char[] { ' ' });
            // If only one name use as first
            if (names.Length < 2) return "";
            return names[names.Length-1];
        }

        static public List<Person> GetPeopleFromCSV(string importFN)
        {
             // Read the file as one string.
             System.IO.StreamReader myFile = new System.IO.StreamReader(importFN);
             string bigString = myFile.ReadToEnd();

             // Now divide the string into lines
             string[] lines = bigString.Split(new char[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);

            // Now get column numbers from header string
            //int nameColumn = Library.GetCSVColumnNum(lines[0], "Name");
            string header = lines[0];
            int firstNameColumn = Library.GetCSVColumnNum(header, "First Name");
            int lastNameColumn = Library.GetCSVColumnNum(header, "Last Name");
            int fullNameColumn = Library.GetCSVColumnNum(header, "Name");

            // Now create list of candidate people
            List<Person> newPeople = new List<Person>();
            for (int i = 1; i < lines.Length; i++)
            {
                string curLine = (string)lines[i];
                string[] columns = curLine.Split(new char[] { ',' });
                string firstName = "";
                string lastName = "";

                // If first incomplete try to pull from full name
                if (firstNameColumn >= 0)
                {
                    firstName = columns[firstNameColumn];
                }
                else if (fullNameColumn >= 0)
                {
                    string fullName = columns[fullNameColumn];
                    firstName = FirstNameFromFullName(fullName);
                }

                // If last incomplete try to pull from full name
                if (lastNameColumn >= 0)
                {
                    lastName = columns[lastNameColumn];
                }
                else if (fullNameColumn >= 0)
                {
                    string fullName = columns[fullNameColumn];
                    lastName = LastNameFromFullName(fullName);
                }

                // Ignore names that contain "@" symbols as outlook sometimes makes emails in to names 
                if (firstName.Contains("@")) firstName = "";
                if (lastName.Contains("@")) lastName = "";

                // Remove invalid characters
                if (firstName != "") firstName = Options.CleanString(firstName);
                if (lastName != "") lastName = Options.CleanString(lastName);
                
                // Only except people with either a first and last name
                if (firstName != "" && lastName != "")
                {
                    // Create new person in import directory
                    Person newPerson = new Person();
                    newPerson.PersonType = PersonType.IMPORT;  
                    newPerson.FirstName = firstName;
                    newPerson.LastName = lastName;
                    newPeople.Add(newPerson);
                }
            }
            return newPeople;
        }

        /// <summary>
        /// Given a list of people return the subset of people that either aren't in the
        /// Library already or have new or changed data
        /// </summary>
        /// <param name="oldList"></param>
        /// <returns></returns>
        static public List<Person> RemoveExistingPeopleWithNoChanges(List<Person> newList)
        {
            List<Person> returnList = new List<Person>();

            foreach (Person newPerson in newList)
            {
                Person oldPerson = Library.PersonExists(newPerson);
                if (oldPerson != null)
                {
                    if (!oldPerson.HasChangedData(newPerson))
                    {
                        returnList.Add(newPerson);
                    }
                }
                else
                {
                    returnList.Add(newPerson);
                }
            }
            return returnList;
        }

        static public void AddPeopleFromTextFile(string importFN)
        {
            // Read the file as one string.
            System.IO.StreamReader myFile = new System.IO.StreamReader(importFN);
            string bigString = myFile.ReadToEnd();

            // Now divide the string into lines
            string[] lines = bigString.Split(new char[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);

            // Now create list of candidate people
            Person newPerson = null;
            for (int i = 0; i < lines.Length; i++)
            {
                string curLine = (string)lines[i];

                // Check if new term
                if (curLine.StartsWith("}"))
                {
                    // Save last created person (if there was one)
                    if (newPerson != null)
                    {
                        newPerson.Save();
                        Library.AddPerson(newPerson);
                    }
                    string name = Options.CleanString(curLine);
                    if (name != "")
                    {
                        // Create new person
                        newPerson = new Person();
                        newPerson.PersonType = PersonType.LIVE;
                        newPerson.FirstName = name;
                    }
                }
                // Else if definition
                else if (curLine.StartsWith("{"))
                {
                    if (newPerson == null)
                    {
                        System.Windows.Forms.MessageBox.Show("Parse Error! No person.");
                        return;
                    }

                    string cleanStr = curLine.Trim(new char[] { ' ', '{' });
                    cleanStr.Replace('\"','\'');
                    newPerson.Description += cleanStr;
                }
            } 
            return;
        }
    }
}
*/
