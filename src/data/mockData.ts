export type DriverStatus = 'ATIVO' | 'MONITORADO' | 'BLOQUEADO';
export type Comunicacao = 'BOA' | 'REGULAR' | 'RUIM';
export type DesvioRota = 'NENHUM' | 'LEVE' | 'GRAVE';
export type Postura = 'OK' | 'RUIM';
export type BlockType = 'NO_SHOW' | 'SCORE_BAIXO' | 'MANUAL' | 'OCORRENCIA_GRAVE';

export interface Driver {
  id: string;
  nome: string;
  status: DriverStatus;
  scoreMedia: number;
  totalViagens: number;
  variancia: number;
  ocorrencias: number;
  created_at: string;
}

export interface Trip {
  id: string;
  driver_id: string;
  driverName: string;
  data: string;
  eta_origem: number;
  eta_destino: number;
  cpt: number;
  uso_app: number;
  checklist: boolean;
  ocorrencia: boolean;
  score_final: number;
  evaluated: boolean;
}

export interface OperatorEvaluation {
  id: string;
  trip_id: string;
  comunicacao: Comunicacao;
  atendeu: boolean;
  desvio_rota: DesvioRota;
  postura: Postura;
  ajuste_manual: number;
  observacao: string;
  created_by: string;
  created_at: string;
}

export interface Block {
  id: string;
  driver_id: string;
  driverName: string;
  tipo: BlockType;
  motivo: string;
  ativo: boolean;
  data_inicio: string;
  data_fim: string | null;
  created_by: string;
}

const driverNames = [
  'Carlos Silva', 'João Oliveira', 'Pedro Santos', 'Lucas Ferreira',
  'Marcos Souza', 'Rafael Costa', 'André Lima', 'Felipe Almeida',
  'Bruno Ribeiro', 'Gustavo Martins', 'Roberto Gomes', 'Diego Araújo',
  'Thiago Pereira', 'Rodrigo Barbosa', 'Eduardo Carvalho'
];

export const mockDrivers: Driver[] = driverNames.map((nome, i) => {
  const score = Math.round(50 + Math.random() * 50);
  const status: DriverStatus = score < 60 ? 'BLOQUEADO' : score < 75 ? 'MONITORADO' : 'ATIVO';
  return {
    id: `d${i + 1}`,
    nome,
    status,
    scoreMedia: score,
    totalViagens: Math.floor(15 + Math.random() * 50),
    variancia: Math.round(Math.random() * 20),
    ocorrencias: Math.floor(Math.random() * 5),
    created_at: '2025-01-15',
  };
}).sort((a, b) => b.scoreMedia - a.scoreMedia);

export const mockTrips: Trip[] = [];
for (let i = 0; i < 40; i++) {
  const driver = mockDrivers[Math.floor(Math.random() * mockDrivers.length)];
  const eta_o = 85 + Math.random() * 15;
  const eta_d = 80 + Math.random() * 20;
  const cpt = 90 + Math.random() * 10;
  const uso = 80 + Math.random() * 20;
  const checklist = Math.random() > 0.15;
  const ocorrencia = Math.random() < 0.1;

  let score = 100;
  if (eta_o < 95) score -= 5;
  if (eta_d < 90) score -= 15;
  if (cpt < 98) score -= 5;
  if (uso < 90) score -= 10;
  if (!checklist) score -= 15;
  if (ocorrencia) score -= 25;

  mockTrips.push({
    id: `t${i + 1}`,
    driver_id: driver.id,
    driverName: driver.nome,
    data: `2025-03-${String(1 + (i % 17)).padStart(2, '0')}`,
    eta_origem: Math.round(eta_o * 10) / 10,
    eta_destino: Math.round(eta_d * 10) / 10,
    cpt: Math.round(cpt * 10) / 10,
    uso_app: Math.round(uso * 10) / 10,
    checklist,
    ocorrencia,
    score_final: Math.max(0, Math.min(100, score)),
    evaluated: Math.random() > 0.4,
  });
}

export const mockBlocks: Block[] = [
  {
    id: 'b1', driver_id: 'd12', driverName: 'Diego Araújo',
    tipo: 'NO_SHOW', motivo: 'Não compareceu à viagem #t12',
    ativo: true, data_inicio: '2025-03-10', data_fim: null, created_by: 'Operador Ana',
  },
  {
    id: 'b2', driver_id: 'd14', driverName: 'Rodrigo Barbosa',
    tipo: 'SCORE_BAIXO', motivo: '3 viagens consecutivas com score < 60',
    ativo: true, data_inicio: '2025-03-08', data_fim: null, created_by: 'Sistema',
  },
  {
    id: 'b3', driver_id: 'd11', driverName: 'Roberto Gomes',
    tipo: 'MANUAL', motivo: 'Comportamento inadequado reportado pelo cliente',
    ativo: false, data_inicio: '2025-02-20', data_fim: '2025-03-01', created_by: 'Gestor Paulo',
  },
];

export function getScoreColor(score: number): string {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
}

export function getStatusVariant(status: DriverStatus) {
  switch (status) {
    case 'ATIVO': return 'success' as const;
    case 'MONITORADO': return 'warning' as const;
    case 'BLOQUEADO': return 'destructive' as const;
  }
}

export function getBlockTypeLabel(tipo: BlockType) {
  switch (tipo) {
    case 'NO_SHOW': return 'No-Show';
    case 'SCORE_BAIXO': return 'Score Baixo';
    case 'MANUAL': return 'Manual';
    case 'OCORRENCIA_GRAVE': return 'Ocorrência Grave';
  }
}
