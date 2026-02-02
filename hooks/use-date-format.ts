/**
 * Hook personalizado para formatear fechas de manera consistente en toda la aplicación
 */
export const useDateFormat = () => {
  /**
   * Formatea una fecha a formato español con día, mes y año
   * @param dateString - String de fecha o objeto Date
   * @returns Fecha formateada como "1 de enero de 2026"
   */
  const formatDate = (dateString: string | Date): string => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Formatea una fecha a formato corto español
   * @param dateString - String de fecha o objeto Date
   * @returns Fecha formateada como "01/01/2026"
   */
  const formatDateShort = (dateString: string | Date): string => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /**
   * Formatea una fecha con hora
   * @param dateString - String de fecha o objeto Date
   * @returns Fecha y hora formateadas
   */
  const formatDateTime = (dateString: string | Date): string => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Formatea solo la hora
   * @param dateString - String de fecha o objeto Date
   * @returns Hora formateada como "14:30"
   */
  const formatTime = (dateString: string | Date): string => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return {
    formatDate,
    formatDateShort,
    formatDateTime,
    formatTime,
  };
};
