export const SAIDAS_FILA_STORAGE_KEY = "itam_saidas_fila_impressao";

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const getISODate = (date = new Date()) => {
  return date.toISOString().split("T")[0];
};

export const formatarData = (isoDate: string) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

export const loadAssets = async (incluirAssinatura: boolean) => {
  const loadAsset = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      return response.arrayBuffer();
    } catch (error) {
      console.warn(
        `Aviso: Não foi possível carregar ${url}. Verifique se a pasta public/ contém os assets do seu projeto antigo.`,
      );
      return new ArrayBuffer(0); // Retorna buffer vazio para não quebrar a aplicação
    }
  };

  const assets: any = {};
  const [logoBuffer, fontNormalBuffer, fontBoldBuffer] = await Promise.all([
    loadAsset("../../assets/itam-logo.jpeg"),
    loadAsset("../../fonts/calibri-regular.ttf"),
    loadAsset("../../fonts/calibri-bold.ttf"),
  ]);

  assets.logoBase64 =
    logoBuffer.byteLength > 0 ? arrayBufferToBase64(logoBuffer) : "";
  assets.fontNormalBase64 =
    fontNormalBuffer.byteLength > 0
      ? arrayBufferToBase64(fontNormalBuffer)
      : "";
  assets.fontBoldBase64 =
    fontBoldBuffer.byteLength > 0 ? arrayBufferToBase64(fontBoldBuffer) : "";

  if (incluirAssinatura) {
    const assinaturaBuffer = await loadAsset("../../assets/assinatura-2.png");
    assets.assinaturaBase64 =
      assinaturaBuffer.byteLength > 0
        ? arrayBufferToBase64(assinaturaBuffer)
        : "";
  } else {
    assets.assinaturaBase64 = "";
  }

  return assets;
};

export const setupDocFonts = (doc: any, assets: any) => {
  if (assets.fontNormalBase64 && assets.fontBoldBase64) {
    doc.addFileToVFS("Calibri-Regular.ttf", assets.fontNormalBase64);
    doc.addFont("Calibri-Regular.ttf", "Calibri", "normal");
    doc.addFileToVFS("Calibri-Bold.ttf", assets.fontBoldBase64);
    doc.addFont("Calibri-Bold.ttf", "Calibri", "bold");
  }
};
