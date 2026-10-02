export function evidenceDescriptions(fileCount: number, values: FormDataEntryValue[]) {
  const descriptions = values.map((value) => String(value).trim());
  if (descriptions.length !== fileCount || descriptions.some((description) => !description)) return null;
  return descriptions;
}
