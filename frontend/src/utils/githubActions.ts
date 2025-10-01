// src/utils/githubActions.ts (Bu dosya, önceki yanıttan alınmıştır)

export const triggerScraperWorkflow = async () => {
  // Env değişkenlerini oku
  const owner = import.meta.env.VITE_GITHUB_OWNER as string;
  const repo = import.meta.env.VITE_GITHUB_REPO as string;
  const workflowId = import.meta.env.VITE_WORKFLOW_ID as string;
  const token = import.meta.env.VITE_GITHUB_PAT as string;

  if (!owner || !repo || !workflowId || !token) {
    throw new Error(
      "GitHub ENV değişkenleri eksik. Lütfen .env.local'ı kontrol edin."
    );
  }

  // GitHub API endpoint'i
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      // Token'ı "token" ön ekiyle gönder
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Workflow'un çalışacağı dal (branch)
      ref: "main",
    }),
  });

  if (response.status === 204) {
    // 204 No Content, işlemin başarılı olduğunu gösterir
    return {
      success: true,
      message:
        "Workflow başarıyla tetiklendi. Script şimdi login adımına geçiyor.",
    };
  } else {
    const errorData = await response.json();
    throw new Error(
      `GitHub API Hatası: ${response.status} - ${
        errorData.message || "Bilinmeyen Hata"
      }`
    );
  }
};
