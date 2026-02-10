"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillLevel = exports.Position = exports.RequestType = void 0;
var RequestType;
(function (RequestType) {
    RequestType["TEAM_NEEDS_PLAYER"] = "team_needs_player";
    RequestType["PLAYER_NEEDS_TEAM"] = "player_needs_team";
})(RequestType || (exports.RequestType = RequestType = {}));
var Position;
(function (Position) {
    Position["GOALIE"] = "goalie";
    Position["DEFENSE"] = "defense";
    Position["FORWARD"] = "forward";
})(Position || (exports.Position = Position = {}));
var SkillLevel;
(function (SkillLevel) {
    SkillLevel["BEGINNER"] = "beginner";
    SkillLevel["INTERMEDIATE"] = "intermediate";
    SkillLevel["ADVANCED"] = "advanced";
    SkillLevel["ELITE"] = "elite";
})(SkillLevel || (exports.SkillLevel = SkillLevel = {}));
//# sourceMappingURL=requests.js.map