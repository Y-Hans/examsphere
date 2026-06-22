import { TenantType } from '@prisma/client';

export interface TenantFeatureConfig {
  maxStudents: number;
  maxTeachers: number;
  maxBatches: number;
  whiteLabel: boolean;
  aiTutor: boolean;
  customBranding: boolean;
  ssoEnabled: boolean;
  analyticsLevel: 'BASIC' | 'ADVANCED' | 'ENTERPRISE';
}

export abstract class TenantStrategy {
  constructor(public tenantType: TenantType) {}

  abstract getFeatureConfig(): TenantFeatureConfig;
  abstract getWelcomeMessage(): string;
}

export class IndividualStrategy extends TenantStrategy {
  constructor() {
    super('INDIVIDUAL');
  }

  getFeatureConfig(): TenantFeatureConfig {
    return {
      maxStudents: 1,
      maxTeachers: 0,
      maxBatches: 0,
      whiteLabel: false,
      aiTutor: true, // Depends on subscription, but capability exists
      customBranding: false,
      ssoEnabled: false,
      analyticsLevel: 'ADVANCED',
    };
  }

  getWelcomeMessage(): string {
    return 'Welcome to your personal learning dashboard!';
  }
}

export class InstituteStrategy extends TenantStrategy {
  constructor() {
    super('INSTITUTE');
  }

  getFeatureConfig(): TenantFeatureConfig {
    return {
      maxStudents: 1000, // Default, expanded by subscription
      maxTeachers: 100,
      maxBatches: 50,
      whiteLabel: true,
      aiTutor: true,
      customBranding: true,
      ssoEnabled: false,
      analyticsLevel: 'ADVANCED',
    };
  }

  getWelcomeMessage(): string {
    return 'Welcome to your Institute Portal!';
  }
}

export class SchoolStrategy extends TenantStrategy {
  constructor() {
    super('SCHOOL');
  }

  getFeatureConfig(): TenantFeatureConfig {
    return {
      maxStudents: 2000,
      maxTeachers: 200,
      maxBatches: 100, // Classes/Sections
      whiteLabel: true,
      aiTutor: false,
      customBranding: true,
      ssoEnabled: true,
      analyticsLevel: 'ENTERPRISE',
    };
  }

  getWelcomeMessage(): string {
    return 'Welcome to your School Portal!';
  }
}

export class EnterpriseStrategy extends TenantStrategy {
  constructor() {
    super('ENTERPRISE');
  }

  getFeatureConfig(): TenantFeatureConfig {
    return {
      maxStudents: 10000,
      maxTeachers: 500,
      maxBatches: -1, // Unlimited
      whiteLabel: true,
      aiTutor: true,
      customBranding: true,
      ssoEnabled: true,
      analyticsLevel: 'ENTERPRISE',
    };
  }

  getWelcomeMessage(): string {
    return 'Welcome to your Enterprise Portal!';
  }
}

export class TenantStrategyFactory {
  private static strategies: Record<TenantType, () => TenantStrategy> = {
    INDIVIDUAL: () => new IndividualStrategy(),
    INSTITUTE: () => new InstituteStrategy(),
    SCHOOL: () => new SchoolStrategy(),
    ENTERPRISE: () => new EnterpriseStrategy(),
  };

  static getStrategy(tenantType: TenantType): TenantStrategy {
    const strategyFactory = this.strategies[tenantType];
    if (!strategyFactory) {
      throw new Error(`Unsupported tenant type: ${tenantType}`);
    }
    return strategyFactory();
  }
}