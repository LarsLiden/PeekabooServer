export interface Relationship {
    type: RelationshipType
    guid: string
    name?: string
}

export enum RType {
    MARRIED_TO = "Married to",
    CHILD_OF = "Child of",
    PARENT_OF = "Parent of",
    DIVORCED_FROM = "Divorced from",
    DATING = "Dating",
    ONCE_DATED = "Once dated",
    WORDS_FOR = "Works for",
    BOSS_OF = "Boss of",
    WORKED_FOR = "Worked for",
    FORMER_BOSS_OF = "Former boss of",
    LIVES_WITH = "Lives with",
    LIVED_WITH = "Lived with",
    SIBLING_OF = "Sibling of",
    PM_BY = "PM by",
    PM_OF = "PM of",
    GRANDCHILD_OF = "Grandchild of",
    GRANDPARENT_OF = "Grandparent of",
    STEP_SIBLING_OF = "Step Sibling of",
    STEP_CHILD_OF = "Stepchild of",
    STEP_PARENT_OF = "Stepparent of"
}
export class RelationshipType {
    static relationshipTypes: RelationshipType[] | null = null

    constructor(public from: RType, public to: RType) {
    }
   
    private static addRType(from: RType, to?: RType): void {
        if (!this.relationshipTypes) {
            this.relationshipTypes = []
        }
        if (!to) {
            this.relationshipTypes.push(new RelationshipType(from, from))   
        }
        else {
            this.relationshipTypes.push(new RelationshipType(from, to))
            this.relationshipTypes.push(new RelationshipType(to, from)) 
        }
    }
    private static init(): void {
        // Create types
        this.addRType(RType.MARRIED_TO)
        this.addRType(RType.CHILD_OF, RType.PARENT_OF)
        this.addRType(RType.DIVORCED_FROM)
        this.addRType(RType.DATING)
        this.addRType(RType.ONCE_DATED)
        this.addRType(RType.WORDS_FOR, RType.BOSS_OF)
        this.addRType(RType.WORKED_FOR, RType.FORMER_BOSS_OF)
        this.addRType(RType.LIVES_WITH)
        this.addRType(RType.LIVED_WITH)
        this.addRType(RType.SIBLING_OF)
        this.addRType(RType.PM_BY, RType.PM_OF)
        this.addRType(RType.GRANDCHILD_OF, RType.GRANDPARENT_OF)
        this.addRType(RType.STEP_SIBLING_OF)
        this.addRType(RType.STEP_CHILD_OF, RType.STEP_PARENT_OF)
    } 
    public static getRelationshipType(name: string): RelationshipType {
        if (!this.relationshipTypes) {
            this.init()
        }
        const relationshipType = this.relationshipTypes!.find(rt => rt.from.toString() === name )
        if (!relationshipType) {
            throw new Error(`Can't find rtype ${name}`)
        }
        return relationshipType
    }
   
}