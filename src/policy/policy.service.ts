import { Injectable, Logger } from '@nestjs/common';
import { Policy, Policies, PolicyMatchResult } from './policy.types';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import type { PolicyRepository } from './repositories/policy-repository.interface';
import {
  PolicyNotFoundException,
  PolicyForbiddenException,
} from './exceptions/policy.exceptions';
import { BadRequestException } from '../common/exceptions/common.exceptions';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(private readonly policyRepository: PolicyRepository) {}

  async createMany(
    userId: string,
    createPoliciesDto: Array<CreatePolicyDto>,
    organizationId?: string,
  ): Promise<Policies> {
    if (!organizationId) {
      throw new PolicyForbiddenException('Organization ID is required');
    }

    return this.policyRepository.createManyPolicies(
      userId,
      createPoliciesDto,
      organizationId,
    );
  }

  async create(
    organizationId: string,
    userId: string,
    createPolicyDto: CreatePolicyDto,
  ): Promise<Policy> {
    return this.policyRepository.createPolicy(organizationId, userId, createPolicyDto);
  }

  async findAll(params: {
    userId?: string;
    organizationId?: string;
    isActive?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Policies> {
    const { userId, organizationId, isActive, skip, take } = params;

    if (!organizationId) {
      throw new PolicyForbiddenException('Organization ID is required');
    }

    return this.policyRepository.findAllPolicies({
      userId,
      organizationId,
      isActive,
      skip,
      take,
    });
  }

  async findOne(id: string, organizationId?: string): Promise<Policy> {
    if (!organizationId) {
      throw new PolicyForbiddenException('Organization ID is required');
    }

    const policy = await this.policyRepository.findPolicyById(id);

    if (!policy) {
      throw new PolicyNotFoundException(`Policy with ID ${id} not found`);
    }

    if (policy.organizationId !== organizationId) {
      throw new PolicyForbiddenException('User does not have access to this policy');
    }

    return policy;
  }

  async update(
    id: string,
    updatePolicyDto: UpdatePolicyDto,
    organizationId?: string,
  ): Promise<Policy> {
    if (!organizationId) {
      throw new PolicyForbiddenException('Organization ID is required');
    }

    return this.policyRepository.updatePolicy(id, updatePolicyDto, organizationId);
  }

  async remove(id: string, organizationId?: string): Promise<void> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const doesPolicyBelongToOrganization = await this.policyRepository.verifyPolicyAccess(
      organizationId,
      id,
    );

    if (!doesPolicyBelongToOrganization) {
      throw new PolicyForbiddenException('User does not have access to this policy');
    }

    await this.policyRepository.deletePolicy(id);
    this.logger.log(
      `Policy ${id} successfully deleted by organization ${organizationId}`,
    );
  }

  async findBestMatchForPolicy(
    policyId: string,
    prompt: string,
    organizationId?: string,
  ): Promise<PolicyMatchResult> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required for policy evaluation');
    }

    return this.policyRepository.findBestMatchForPolicy(policyId, prompt, organizationId);
  }
}
