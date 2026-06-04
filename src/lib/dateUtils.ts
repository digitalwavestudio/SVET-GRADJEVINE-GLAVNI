export const formatDate = (createdAt: unknown) => {
    if (!createdAt) return 'Danas';
    
    // Check if it is a Firestore Timestamp
    let date: Date;
    if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt && typeof (createdAt as Record<string, unknown>).toDate === 'function') {
        date = (createdAt as { toDate: () => Date }).toDate();
    } else {
        date = new Date(createdAt as string | number | Date);
    }
    
    // Check for valid date
    if (isNaN(date.getTime())) return 'Danas';
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Danas';
    if (diffInDays === 1) return 'Juče';
    if (diffInDays < 7) return `${diffInDays} dana`;
    
    return new Intl.DateTimeFormat('sr-RS', { day: '2-digit', month: '2-digit' }).format(date);
}
