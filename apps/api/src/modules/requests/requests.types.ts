import { Position, RequestType, SkillLevel } from './dto/create-request.dto';

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
