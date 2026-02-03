export declare enum RequestType {
    TEAM_NEEDS_PLAYER = "team_needs_player",
    PLAYER_NEEDS_TEAM = "player_needs_team"
}
export declare enum Position {
    GOALIE = "goalie",
    DEFENSE = "defense",
    FORWARD = "forward"
}
export declare enum SkillLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
}
export interface SpareRequest {
    id: number;
    type: RequestType;
    position: Position;
    skillLevel: SkillLevel;
    payAmount: number;
    arena: string;
    time: string;
    notes?: string;
}
export type CreateRequestInput = Omit<SpareRequest, 'id'>;
