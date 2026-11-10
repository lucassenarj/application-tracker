const KNOWN_SKILLS = [
  'TypeScript',
  'JavaScript',
  'React',
  'React Query',
  'Redux',
  'Zustand',
  'Angular',
  'Vue',
  'Node.js',
  'Java',
  'Spring Boot',
  'Spring Data',
  'Spring Security',
  'Hibernate',
  'Python',
  'Django',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Terraform',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'SQL Server',
  'GraphQL',
  'REST',
  'RESTful',
  'Microservices',
  'Git',
  'CI/CD',
  'Scrum',
  'Agile',
  'JWT',
  'OAuth2',
  'OpenAPI',
  'Kafka',
  'RabbitMQ',
  'NATS',
  'Prometheus',
  'Grafana',
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function detectSkillsInText(text: string): string[] {
  return KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(text))
}
