export function getInitials(fullname: string): string {
  if (!fullname) return "";

  return fullname
    .trim()                 // remove leading/trailing spaces
    .split(/\s+/)           // split by one or more spaces
    .map(name => name.charAt(0).toUpperCase()) // pick first letter of each word
    .join("");              // join initials
}


export function getTwoInitials(fullname: string): string {
  const parts = fullname.trim().split(/\s+/);
  if (parts.length < 2) return getInitials(fullname); // fallback

  return (
    parts[0].charAt(0).toUpperCase() +
    parts[1].charAt(0).toUpperCase()
  );
}


export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string) {
  return str
    .split(" ")
    .map(word => capitalizeFirstLetter(word))
    .join(" ");
}
