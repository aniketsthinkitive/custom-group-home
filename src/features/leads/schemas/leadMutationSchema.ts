import * as yup from 'yup';

// Schema for lead mutation according to API structure
export const leadMutationSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.number().nullable().optional(),
  guardian: yup.lazy((value) => {
    // If value is undefined/null, return a schema that allows it
    if (value == null || value === undefined) {
      return yup.mixed().nullable().optional();
    }
    // If value exists, return the full validation schema
    return yup.object({
      first_name: yup.string().test(
        'guardian-first-name-conditional',
        'Guardian first name is required when guardian object is provided and guardian_uuid is not provided',
        function (fieldValue) {
          // Access guardian_uuid from context (passed during validation)
          const context = this.options.context as any;
          const guardianUuid = context?.guardian_uuid;

          // If guardian_uuid is provided, skip all validation
          if (guardianUuid != null && guardianUuid !== undefined) {
            return true;
          }
          // If guardian object exists and guardian_uuid is not provided, first_name is required
          if (fieldValue == null || fieldValue === undefined || fieldValue === '') {
            return this.createError({ message: 'Guardian first name is required' });
          }
          return true;
        }
      ),
      last_name: yup.string().test(
        'guardian-last-name-conditional',
        'Guardian last name is required when guardian object is provided and guardian_uuid is not provided',
        function (fieldValue) {
          const context = this.options.context as any;
          const guardianUuid = context?.guardian_uuid;
          if (guardianUuid != null && guardianUuid !== undefined) {
            return true;
          }
          if (fieldValue == null || fieldValue === undefined || fieldValue === '') {
            return this.createError({ message: 'Guardian last name is required' });
          }
          return true;
        }
      ),
      phone: yup.string().nullable().optional(),
      email: yup.string().test(
        'guardian-email-conditional',
        'Guardian email is required when guardian object is provided and guardian_uuid is not provided',
        function (fieldValue) {
          // Access guardian_uuid from context (passed during validation)
          const context = this.options.context as any;
          const guardianUuid = context?.guardian_uuid;

          // If guardian_uuid is provided, skip all validation
          if (guardianUuid != null && guardianUuid !== undefined) {
            return true;
          }
          // If guardian object exists and guardian_uuid is not provided, email is required
          if (!fieldValue || fieldValue === '') {
            return this.createError({ message: 'Guardian email is required' });
          }
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(fieldValue)) {
            return this.createError({ message: 'Invalid guardian email' });
          }
          return true;
        }
      ),
    }).nullable().optional();
  }),
  guardian_uuid: yup.string().nullable().optional().test(
    'guardian-uuid-conditional',
    '',
    function () {
      const { guardian } = this.parent;
      // If guardian object is provided, guardian_uuid is not required
      if (guardian != null && guardian !== undefined) {
        return true;
      }
      // If guardian object is not provided, guardian_uuid can be optional (validated by guardian-or-agent-required)
      return true;
    }
  ),
  agent: yup.lazy((value) => {
    // If value is undefined/null, return a schema that allows it
    if (value == null || value === undefined) {
      return yup.mixed().nullable().optional();
    }
    // If value exists, return the full validation schema
    return yup.object({
      first_name: yup.string().test(
        'agent-first-name-conditional',
        'Agent first name is required when agent object is provided and agent_uuid is not provided',
        function (fieldValue) {
          // Access agent_uuid from context (passed during validation)
          const context = this.options.context as any;
          const agentUuid = context?.agent_uuid;

          // If agent_uuid is provided, skip all validation
          if (agentUuid != null && agentUuid !== undefined) {
            return true;
          }
          // If agent object exists and agent_uuid is not provided, first_name is required
          if (fieldValue == null || fieldValue === undefined || fieldValue === '') {
            return this.createError({ message: 'Agent first name is required' });
          }
          return true;
        }
      ),
      last_name: yup.string().test(
        'agent-last-name-conditional',
        'Agent last name is required when agent object is provided and agent_uuid is not provided',
        function (fieldValue) {
          const context = this.options.context as any;
          const agentUuid = context?.agent_uuid;
          if (agentUuid != null && agentUuid !== undefined) {
            return true;
          }
          if (fieldValue == null || fieldValue === undefined || fieldValue === '') {
            return this.createError({ message: 'Agent last name is required' });
          }
          return true;
        }
      ),
      phone: yup.string().nullable().optional(),
      email: yup.string().test(
        'agent-email-conditional',
        'Agent email is required when agent object is provided and agent_uuid is not provided',
        function (fieldValue) {
          // Access agent_uuid from context (passed during validation)
          const context = this.options.context as any;
          const agentUuid = context?.agent_uuid;

          // If agent_uuid is provided, skip all validation
          if (agentUuid != null && agentUuid !== undefined) {
            return true;
          }
          // If agent object exists and agent_uuid is not provided, email is required
          if (!fieldValue || fieldValue === '') {
            return this.createError({ message: 'Agent email is required' });
          }
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(fieldValue)) {
            return this.createError({ message: 'Invalid agent email' });
          }
          return true;
        }
      ),
    }).nullable().optional();
  }),
  agent_uuid: yup.string().nullable().optional().test(
    'agent-uuid-conditional',
    '',
    function () {
      const { agent } = this.parent;
      // If agent object is provided, agent_uuid is not required
      if (agent != null && agent !== undefined) {
        return true;
      }
      // If agent object is not provided, agent_uuid can be optional (validated by guardian-or-agent-required)
      return true;
    }
  ),
  address: yup.object({
    line1: yup.string().nullable().optional(),
    line2: yup.string().nullable().optional(),
    city: yup.string().nullable().optional(),
    state: yup.string().nullable().optional(),
    zipcode: yup.string().nullable().optional(),
    country: yup.string().nullable().optional(),
  }).nullable().optional(),
  date_of_birth: yup.string().required('Date of birth is required'),
  gender: yup.string().oneOf(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).nullable().optional(),
  referral_source: yup.string().nullable().optional(),
  status: yup.string().oneOf(['DRAFT', 'UNDER_REVIEW', 'DOCS_PENDING', 'ONBOARDING_IN_PROGRESS', 'COMPLETED', 'REJECTED']).nullable().optional(),
  guardian_relation: yup.string().nullable().optional(),
  insurance: yup.object({
    provider: yup.string().nullable().optional(),
    policy_number: yup.string().nullable().optional(),
    status: yup.boolean().nullable().optional(),
  }).nullable().optional(),
}).test(
  'guardian-or-agent-required',
  'At least one of guardian or agent must be provided (either guardian_uuid, guardian object, agent_uuid, or agent object)',
  function (value) {
    const { guardian, guardian_uuid, agent, agent_uuid } = value || {};

    // Check if at least one guardian option is provided
    const hasGuardian = (guardian_uuid != null && guardian_uuid !== undefined) ||
      (guardian != null && guardian !== undefined);

    // Check if at least one agent option is provided
    const hasAgent = (agent_uuid != null && agent_uuid !== undefined) ||
      (agent != null && agent !== undefined);

    // At least one of guardian or agent must be provided
    return hasGuardian || hasAgent;
  }
);

export type LeadMutationData = yup.InferType<typeof leadMutationSchema>;
