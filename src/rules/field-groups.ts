export interface FieldDefinition {
  key: string;
  required: boolean;
}

export interface FieldGroup {
  group: string;
  fields: FieldDefinition[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    group: "Identity & Contacts",
    fields: [
      { key: "product_name", required: true },
      { key: "brand", required: true },
      { key: "manufacturer_name", required: false },
      { key: "manufacturer_address", required: false },
      { key: "contact_email_or_url", required: false },
    ],
  },
  {
    group: "Composition & Origin",
    fields: [
      { key: "materials", required: false },
      { key: "country_of_origin", required: false },
    ],
  },
  {
    group: "Safety & Use",
    fields: [
      { key: "warnings", required: false },
      { key: "instructions", required: false },
      { key: "care_instructions", required: false },
    ],
  },
  {
    group: "Claims & Evidence",
    fields: [
      { key: "marketing_claims", required: false },
      { key: "certifications", required: false },
    ],
  },
];
