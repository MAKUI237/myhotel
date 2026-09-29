export function money(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(value);
}

export const roomStatusLabel: Record<string, string> = {
  disponible: 'Disponible',
  occupee: 'Occupée',
  nettoyage: 'Nettoyage',
  maintenance: 'Maintenance',
  reservee: 'Réservée',
};

export const staffStatusLabel: Record<string, string> = {
  actif: 'Actif',
  conge: 'En congé',
  arret: 'Arrêt',
};

export const reservationStatusLabel: Record<string, string> = {
  confirmee: 'Confirmée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const reservationTone: Record<string, 'gold' | 'ink' | 'muted'> = {
  confirmee: 'gold',
  en_cours: 'ink',
  terminee: 'muted',
  annulee: 'muted',
};

export const invoiceStatusLabel: Record<string, string> = {
  payee: 'Payée',
  en_attente: 'En attente',
  en_retard: 'En retard',
};
