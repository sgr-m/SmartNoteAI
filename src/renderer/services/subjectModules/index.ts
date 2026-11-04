/**
 * Subject Modules Entry Point
 * Registers all independent subject teaching modules into the shared SubjectRegistry
 */

import { SubjectRegistry } from '../subjectRegistry/SubjectRegistry';
import { CommonResourcesModule } from './commonResourcesModule';
import { MathematicsModule } from './mathModule';
import { PhysicsModule } from './physicsModule';
import { ChemistryModule } from './chemistryModule';
import { ComputerScienceModule } from './csModule';
import { DigitalLogicModule } from './digitalLogicModule';
import { GeographyModule } from './geographyModule';
import { FlowchartModule } from './flowchartModule';
import { GeneralTeachingModule } from './generalTeachingModule';

export function initializeSubjectModules(): void {
  SubjectRegistry.clear();
  // Common Resources placed at the very beginning of the subjects
  SubjectRegistry.registerModule(CommonResourcesModule);
  SubjectRegistry.registerModule(MathematicsModule);
  SubjectRegistry.registerModule(PhysicsModule);
  SubjectRegistry.registerModule(ChemistryModule);
  SubjectRegistry.registerModule(ComputerScienceModule);
  SubjectRegistry.registerModule(DigitalLogicModule);
  SubjectRegistry.registerModule(GeographyModule);
  SubjectRegistry.registerModule(GeneralTeachingModule);
}

// Auto-initialize on module load
initializeSubjectModules();

export {
  SubjectRegistry,
  CommonResourcesModule,
  MathematicsModule,
  PhysicsModule,
  ChemistryModule,
  ComputerScienceModule,
  DigitalLogicModule,
  GeographyModule,
  FlowchartModule,
  GeneralTeachingModule,
};

export {
  compileMathFunction,
  evaluateMathFunction,
  type CompiledMathFunction,
} from './mathFunctionParser';
