import dayjs from "dayjs";

export const centsToYuan = (value: number): string => (value / 100).toFixed(2);

export const maskName = (name: string): string => {
  if (!name) return "-";
  return `${name.charAt(0)}*`;
};

export const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  return dayjs(value).format("YYYY-MM-DD HH:mm");
};

export const formatDate = (value?: string): string => {
  if (!value) return "-";
  return dayjs(value).format("YYYY-MM-DD");
};
