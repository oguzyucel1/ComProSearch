// src/utils/githubActions.ts (GÜNCELLENMİŞ VERSİYON)

/**
 * GitHub Actions'ta belirli bir workflow dosyasını uzaktan tetikler.
 * @param workflowFileName Tetiklenecek workflow dosyasının adı (örn: 'bayinet_scraper.yml')
 * @param branch Workflow'un çalışacağı dal adı (varsayılan: 'main')
 */
export const triggerWorkflow = async (
  workflowFileName: string,
  branch: string = "main"
) => {
  // Env değişkenlerini oku
  const owner = import.meta.env.VITE_GITHUB_OWNER as string;
  const repo = import.meta.env.VITE_GITHUB_REPO as string;
  const token = import.meta.env.VITE_GITHUB_PAT as string;

  if (!owner || !repo || !token) {
    throw new Error(
      "GitHub ENV değişkenleri eksik. Lütfen VITE_GITHUB_OWNER, VITE_GITHUB_REPO ve VITE_GITHUB_PAT'ı kontrol edin."
    );
  }

  // GitHub API endpoint'i
  // workflowId yerine doğrudan parametre olarak gelen dosya adını (workflowFileName) kullanıyoruz
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`;

  console.log(`Workflow tetikleniyor: ${workflowFileName} (${apiUrl})`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: branch, // Workflow'un çalışacağı dal
    }),
  });

  if (response.status === 204) {
    // 204 No Content, işlemin başarılı olduğunu gösterir
    return {
      success: true,
      message: `${workflowFileName} workflow'u başarıyla tetiklendi.`,
    };
  } else {
    const errorData = await response.json();
    throw new Error(
      `GitHub API Hatası (${workflowFileName}): ${response.status} - ${
        errorData.message || "Bilinmeyen Hata"
      }`
    );
  }
};
