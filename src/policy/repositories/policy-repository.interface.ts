import { Policy, Policies, PolicyMatchResult } from '../policy.types';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';

export const POLICY_REPOSITORY = 'POLICY_REPOSITORY';

export interface FindAllParams {
  userId?: string;
  organizationId?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
}

export interface PolicyRepository {
  createPolicy(
    organizationId: string,
    userId: string,
    createPolicyDto: CreatePolicyDto,
  ): Promise<Policy>;

  createManyPolicies(
    userId: string,
    createPoliciesDto: Array<CreatePolicyDto>,
    organizationId?: string,
  ): Promise<Policies>;

  findAllPolicies(params: FindAllParams): Promise<Policies>;

  findPolicyById(id: string): Promise<Policy | null>;

  verifyPolicyAccess(organizationId: string, policyId: string): Promise<boolean>;

  updatePolicy(
    id: string,
    updatePolicyDto: UpdatePolicyDto,
    organizationId: string,
  ): Promise<Policy>;

  deletePolicy(id: string): Promise<void>;

  findBestMatchForPolicy(
    policyId: string,
    prompt: string,
    organizationId: string,
  ): Promise<PolicyMatchResult>;
}
