/**
 * Subject Modules Entry Point
 * Registers all independent subject teaching modules into the shared SubjectRegistry
 */

import { SubjectRegistry } from '../subjectRegistry/SubjectRegistry';
import { MathematicsModule } from './mathModule';
import { PhysicsModule } from './physicsModule';
import { ChemistryModule } from './chemistryModule';
import { ComputerScienceModule } from './csModule';
import { DigitalLogicModule } from './digitalLogicModule';
import { FlowchartModule } from './flowchartModule';
import { GeneralTeachingModule } from './generalTeachingModule';

export function initializeSubjectModules(): void {
  SubjectRegistry.clear();
  SubjectRegistry.registerModule(MathematicsModule);
  SubjectRegistry.registerModule(PhysicsModule);
  SubjectRegistry.registerModule(ChemistryModule);
  SubjectRegistry.registerModule(ComputerScienceModule);
  SubjectRegistry.registerModule(DigitalLogicModule);
  SubjectRegistry.registerModule(FlowchartModule);
  SubjectRegistry.registerModule(GeneralTeachingModule);
}

// Auto-initialize on module load
initializeSubjectModules();

export {
  SubjectRegistry,
  MathematicsModule,
  PhysicsModule,
  ChemistryModule,
  ComputerScienceModule,
  DigitalLogicModule,
  FlowchartModule,
  GeneralTeachingModule,
};

export {
  compileMathFunction,
  evaluateMathFunction,
  type CompiledMathFunction,
} from './mathFunctionParser';
