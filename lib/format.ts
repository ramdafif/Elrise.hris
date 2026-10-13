// Indonesian formatting utilities

export function formatIdr(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatDateId(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeId(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return (
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date) + ' WIB'
    );
  } catch {
    return dateStr;
  }
}

export function formatTimeId(dateStr: string | undefined | null): string {
  if (!dateStr) return '--:--';
  try {
    const date = new Date(dateStr);
    return (
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date) + ' WIB'
    );
  } catch {
    return dateStr;
  }
}
