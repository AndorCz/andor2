// Converts a File object to a GoogleGenerativeAI.Part object
export async function fileToGenerativePart (file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  })
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
  }
}
