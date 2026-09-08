export interface GlossaryEntry {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
}

/**
 * Glossário operacional curto. O painel contextual mostra apenas os termos
 * encontrados no conteúdo da questão/guia atual, evitando transformar a tela
 * em um glossário geral permanente.
 */
export const glossaryEntries: GlossaryEntry[] = [
  {
    id: 'ad',
    term: 'AD — Active Directory',
    aliases: ['AD', 'Active Directory'],
    definition: 'Serviço da Microsoft usado para centralizar identidades, computadores, grupos e permissões em uma rede corporativa.',
  },
  {
    id: 'idp',
    term: 'IdP — Provedor de Identidade',
    aliases: ['IdP', 'Identity Provider', 'provedor de identidade'],
    definition: 'Serviço que autentica usuários e fornece identidade para outros sistemas e aplicações.',
  },
  {
    id: 'mfa',
    term: 'MFA — Autenticação multifator',
    aliases: ['MFA', 'autenticação multifator', 'autenticação de múltiplos fatores'],
    definition: 'Uso de dois ou mais fatores independentes para confirmar a identidade de um usuário.',
  },
  {
    id: 'sso',
    term: 'SSO — Single Sign-On',
    aliases: ['SSO', 'Single Sign-On'],
    definition: 'Mecanismo que permite ao usuário autenticar-se uma vez e acessar diferentes sistemas integrados.',
  },
  {
    id: 'rbac',
    term: 'RBAC — Controle de acesso por função',
    aliases: ['RBAC', 'controle de acesso por função', 'controle de acesso baseado em função'],
    definition: 'Modelo em que permissões são atribuídas conforme o papel ou função exercida pelo usuário.',
  },
  {
    id: 'recertificacao',
    term: 'Recertificação de acesso',
    aliases: ['recertificação', 'recertificacao', 'revisão periódica de acesso', 'revisão de acessos'],
    definition: 'Revisão periódica para confirmar se cada usuário ainda precisa das contas, perfis e permissões que possui.',
  },
  {
    id: 'privilegio-minimo',
    term: 'Privilégio mínimo',
    aliases: ['privilégio mínimo', 'privilegio minimo', 'menor privilégio', 'menor privilegio'],
    definition: 'Princípio de conceder somente os acessos estritamente necessários para a atividade desempenhada.',
  },
  {
    id: 'ris',
    term: 'RIS — Radiology Information System',
    aliases: ['RIS'],
    definition: 'Sistema de informação usado para apoiar processos de radiologia, como agenda, atendimento, fluxo de exames e laudos.',
  },
  {
    id: 'pacs',
    term: 'PACS — Picture Archiving and Communication System',
    aliases: ['PACS'],
    definition: 'Sistema usado para armazenar, consultar e distribuir imagens médicas e informações associadas.',
  },
  {
    id: 'dicom',
    term: 'DICOM — Digital Imaging and Communications in Medicine',
    aliases: ['DICOM'],
    definition: 'Padrão amplamente usado para intercâmbio, armazenamento e identificação de imagens e informações médicas.',
  },
  {
    id: 'vna',
    term: 'VNA — Vendor Neutral Archive',
    aliases: ['VNA', 'Vendor Neutral Archive'],
    definition: 'Repositório de imagens e documentos clínicos projetado para reduzir dependência de um único fornecedor de visualização ou PACS.',
  },
  {
    id: 'vpn',
    term: 'VPN — Rede Privada Virtual',
    aliases: ['VPN', 'Virtual Private Network'],
    definition: 'Canal protegido usado para conectar usuários, fornecedores ou redes por meio de uma rede não confiável, como a internet.',
  },
  {
    id: 'vlan',
    term: 'VLAN — Rede local virtual',
    aliases: ['VLAN'],
    definition: 'Segmentação lógica de rede usada para separar grupos de equipamentos e restringir comunicações entre eles.',
  },
  {
    id: 'firewall',
    term: 'Firewall',
    aliases: ['firewall'],
    definition: 'Controle que permite ou bloqueia comunicações de rede conforme regras previamente definidas.',
  },
  {
    id: 'endpoint',
    term: 'Endpoint',
    aliases: ['endpoint', 'endpoints'],
    definition: 'Dispositivo conectado à rede, como computador, notebook, servidor ou estação de trabalho.',
  },
  {
    id: 'edr',
    term: 'EDR — Endpoint Detection and Response',
    aliases: ['EDR'],
    definition: 'Tecnologia de monitoramento e resposta focada em detectar comportamentos suspeitos nos dispositivos finais.',
  },
  {
    id: 'siem',
    term: 'SIEM — Security Information and Event Management',
    aliases: ['SIEM'],
    definition: 'Plataforma que centraliza e correlaciona registros e alertas de segurança para apoiar detecção e investigação.',
  },
  {
    id: 'log',
    term: 'Log / registro de evento',
    aliases: ['logs', 'log de', 'registro de eventos', 'registros de eventos'],
    definition: 'Registro produzido por um sistema sobre ações, acessos, falhas ou outros eventos relevantes ocorridos no ambiente.',
  },
  {
    id: 'ntp',
    term: 'NTP — Network Time Protocol',
    aliases: ['NTP'],
    definition: 'Protocolo utilizado para manter relógios de equipamentos e sistemas sincronizados.',
  },
  {
    id: 'rto',
    term: 'RTO — Recovery Time Objective',
    aliases: ['RTO', 'Recovery Time Objective'],
    definition: 'Tempo-alvo para restabelecer um serviço ou processo após uma interrupção.',
  },
  {
    id: 'rpo',
    term: 'RPO — Recovery Point Objective',
    aliases: ['RPO', 'Recovery Point Objective'],
    definition: 'Quantidade máxima de perda de dados aceitável, normalmente expressa como um intervalo de tempo.',
  },
  {
    id: 'bia',
    term: 'BIA — Análise de Impacto nos Negócios',
    aliases: ['BIA', 'Business Impact Analysis', 'análise de impacto nos negócios'],
    definition: 'Análise usada para identificar processos críticos, impactos de indisponibilidade e necessidades de recuperação.',
  },
  {
    id: 'sla',
    term: 'SLA — Acordo de Nível de Serviço',
    aliases: ['SLA', 'Service Level Agreement', 'acordo de nível de serviço'],
    definition: 'Compromisso documentado sobre níveis esperados de um serviço, como disponibilidade, suporte ou prazo de atendimento.',
  },
  {
    id: 'ropa',
    term: 'ROPA — Registro das Operações de Tratamento',
    aliases: ['ROPA', 'registro das operações de tratamento'],
    definition: 'Registro organizado das atividades de tratamento de dados pessoais realizadas pela organização.',
  },
  {
    id: 'cmdb',
    term: 'CMDB — Base de Dados de Gerenciamento de Configuração',
    aliases: ['CMDB'],
    definition: 'Base organizada de ativos, componentes e relacionamentos usada para apoiar gestão de configuração e mudanças.',
  },
  {
    id: 'cve',
    term: 'CVE — Common Vulnerabilities and Exposures',
    aliases: ['CVE'],
    definition: 'Identificador público padronizado usado para referenciar vulnerabilidades conhecidas.',
  },
  {
    id: 'cvss',
    term: 'CVSS — Common Vulnerability Scoring System',
    aliases: ['CVSS'],
    definition: 'Sistema usado para representar características técnicas e severidade de vulnerabilidades conhecidas.',
  },
  {
    id: 'gpo',
    term: 'GPO — Group Policy Object',
    aliases: ['GPO', 'Group Policy Object'],
    definition: 'Mecanismo do ambiente Microsoft usado para aplicar configurações e políticas de forma centralizada.',
  },
  {
    id: 'saas',
    term: 'SaaS — Software como Serviço',
    aliases: ['SaaS', 'Software as a Service', 'software como serviço'],
    definition: 'Modelo em que o software é fornecido e operado como serviço, normalmente acessado pela internet.',
  },
  {
    id: 'api',
    term: 'API — Interface de Programação de Aplicações',
    aliases: ['API', 'APIs'],
    definition: 'Interface usada para permitir comunicação estruturada e troca de dados entre sistemas.',
  },
  {
    id: 'tls',
    term: 'TLS — Transport Layer Security',
    aliases: ['TLS'],
    definition: 'Protocolo usado para proteger comunicações de rede por meio de criptografia e autenticação.',
  },
  {
    id: 'ssh',
    term: 'SSH — Secure Shell',
    aliases: ['SSH'],
    definition: 'Protocolo usado para acesso remoto seguro, especialmente para administração de sistemas e servidores.',
  },
  {
    id: 'sftp',
    term: 'SFTP — SSH File Transfer Protocol',
    aliases: ['SFTP'],
    definition: 'Protocolo de transferência de arquivos que utiliza um canal SSH protegido.',
  },
  {
    id: 'hardening',
    term: 'Hardening',
    aliases: ['hardening'],
    definition: 'Processo de reduzir a superfície de ataque por meio de configuração segura, remoção de serviços desnecessários e aplicação de controles apropriados.',
  },
  {
    id: 'baseline',
    term: 'Baseline / configuração de referência',
    aliases: ['baseline'],
    definition: 'Conjunto de configurações mínimas ou esperadas usado como referência para implantação e verificação.',
  },
  {
    id: 'rollback',
    term: 'Rollback',
    aliases: ['rollback'],
    definition: 'Retorno planejado a uma configuração ou versão anterior quando uma mudança causa falha ou impacto indesejado.',
  },
  {
    id: 'downtime',
    term: 'Downtime / período de indisponibilidade',
    aliases: ['downtime'],
    definition: 'Período em que um sistema, serviço ou fluxo não está disponível para uso normal.',
  },
  {
    id: 'playbook',
    term: 'Playbook',
    aliases: ['playbook', 'playbooks'],
    definition: 'Roteiro operacional com passos e responsabilidades para responder a um cenário específico.',
  },
  {
    id: 'hash',
    term: 'Hash',
    aliases: ['hash'],
    definition: 'Valor calculado a partir de um conteúdo, útil para verificar se um arquivo ou evidência foi alterado.',
  },
  {
    id: 'sanitizacao',
    term: 'Sanitização de mídia',
    aliases: ['sanitização', 'sanitizacao', 'sanitização de mídia', 'sanitizacao de midia'],
    definition: 'Processo de remover ou tornar irrecuperáveis dados armazenados em uma mídia antes de descarte, reutilização ou transferência.',
  },
  {
    id: 'raci',
    term: 'RACI — Matriz de responsabilidades',
    aliases: ['RACI'],
    definition: 'Modelo que identifica quem executa (R), quem aprova/responde pelo resultado (A), quem é consultado (C) e quem deve ser informado (I).',
  },
  {
    id: 'psi',
    term: 'PSI — Política de Segurança da Informação',
    aliases: ['PSI', 'Política de Segurança da Informação'],
    definition: 'Documento que estabelece princípios, responsabilidades e diretrizes gerais de segurança da informação da organização.',
  },
];

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hasAlias = (text: string, alias: string): boolean => {
  const normalizedText = normalize(text);
  const normalizedAlias = normalize(alias);
  if (!normalizedAlias) return false;

  // Para siglas/termos curtos, exige borda de palavra para evitar falsos positivos.
  if (normalizedAlias.length <= 4 && /^[a-z0-9]+$/i.test(normalizedAlias)) {
    const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalizedText);
  }

  return normalizedText.includes(normalizedAlias);
};

export const findGlossaryEntries = (context: string, limit = 5): GlossaryEntry[] => {
  const matches = glossaryEntries.filter((entry) =>
    entry.aliases.some((alias) => hasAlias(context, alias))
  );

  return matches.slice(0, limit);
};
