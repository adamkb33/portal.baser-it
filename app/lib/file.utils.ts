export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      if (commaIndex >= 0) {
        resolve(result.slice(commaIndex + 1));
      } else {
        resolve(result);
      }
    };
    reader.readAsDataURL(file);
  });
