import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const useDateFormat = () => {
  const toLocalDate = (date: string | Date) => {
    const parsed =
      typeof date === "string"
        ? new Date(date.replace(" ", "T") + "Z")
        : date;

    return toZonedTime(
      parsed,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  };

  const formatDate = (date: string | Date) =>
    format(toLocalDate(date), "d 'de' MMMM 'de' yyyy", { locale: es });

  const formatDateShort = (date: string | Date) =>
    format(toLocalDate(date), "dd/MM/yyyy", { locale: es });

  const formatDateTime = (date: string | Date) =>
    format(toLocalDate(date), "d 'de' MMMM 'de' yyyy HH:mm a", { locale: es });

  const formatTime = (date: string | Date) =>
    format(toLocalDate(date), "HH:mm a", { locale: es });

  return {
    formatDate,
    formatDateShort,
    formatDateTime,
    formatTime,
  };
};
