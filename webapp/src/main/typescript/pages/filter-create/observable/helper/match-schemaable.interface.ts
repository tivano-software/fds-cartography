import { MatchSchema } from "./match-schema.enum";

export interface MatchSchemaable {
    getMatchSchema(): MatchSchema;
}