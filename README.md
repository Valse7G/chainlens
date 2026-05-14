# ⬡ ChainLens — On-Chain Intelligence Engine

Outil d'analyse on-chain Ethereum 100% client-side.  
**Zéro API IA externe · Zéro coût d'inférence · Etherscan API gratuite**

---

## Architecture des agents autonomes

| Agent | Rôle |
|---|---|
| `computeMetrics` | Calcule ~30 métriques brutes depuis les tx on-chain |
| `ProfilerAgent` | Classifie le wallet (Whale, Bot, DeFi, HODLer…) |
| `BehaviorAgent` | Détecte les patterns comportementaux avec valeurs réelles |
| `RiskAgent` | Score de risque 0–100 (mixer, blacklist, cycling, dust…) |
| `ScoreEngine` | Trust Score agrégé 0–100 |
| `NarrativeGenerator` | Résumé textuel data-driven |

---

## Structure du projet

```
chainlens/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── .gitignore
└── src/
    ├── main.jsx
    └── App.jsx          ← moteur complet + UI
```

---

## 🚀 Déploiement sur Netlify via GitHub

### Étape 1 — Préparer le dépôt local

```bash
# Crée le dossier du projet
mkdir chainlens && cd chainlens

# Copie tous les fichiers livrés dans ce dossier
# (index.html, package.json, vite.config.js, netlify.toml, .gitignore, src/)

# Initialise Git
git init
git add .
git commit -m "feat: init ChainLens on-chain analyzer"
```

### Étape 2 — Pousser sur GitHub

```bash
# Sur github.com → New repository → nom : chainlens (public ou private)
# Puis dans le terminal :

git remote add origin https://github.com/TON_USERNAME/chainlens.git
git branch -M main
git push -u origin main
```

### Étape 3 — Connecter Netlify

1. Va sur **[app.netlify.com](https://app.netlify.com)** → **Add new site** → **Import an existing project**
2. Choisis **GitHub** → autorise Netlify → sélectionne le repo `chainlens`
3. Netlify détecte automatiquement `netlify.toml` — les champs sont pré-remplis :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
4. Clique **Deploy site**

Le premier build prend ~60 secondes. Netlify donne une URL du type :  
`https://chainlens-abc123.netlify.app`

### Étape 4 (optionnel) — Clé Etherscan en variable d'environnement

Pour ne pas hardcoder la clé dans le code source :

1. Netlify → ton site → **Site configuration** → **Environment variables**
2. Ajoute : `VITE_ETHERSCAN_KEY` = `ta_clé_etherscan`
3. Dans `src/App.jsx`, remplace la ligne :
   ```js
   let ES_KEY = "YourApiKeyToken";
   ```
   par :
   ```js
   let ES_KEY = import.meta.env.VITE_ETHERSCAN_KEY || "YourApiKeyToken";
   ```
4. Redeploy → **Trigger deploy** → **Deploy site**

### Étape 5 — Domaine custom (optionnel)

Netlify → **Domain management** → **Add custom domain**  
Exemple : `chainlens.mondomaine.com`  
Ajoute un CNAME chez ton registrar pointant vers l'URL Netlify.  
SSL Let's Encrypt est automatique.

---

## Workflow de mise à jour

Chaque `git push` sur `main` déclenche un redéploiement automatique :

```bash
# Modifier App.jsx, puis :
git add src/App.jsx
git commit -m "fix: amélioration RiskAgent"
git push
# → Netlify rebuild automatiquement en ~45s
```

---

## Développement local

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Clé API Etherscan

- Gratuite sur [etherscan.io/apis](https://etherscan.io/apis)
- Limite : **5 req/s** avec clé gratuite (largement suffisant)
- Sans clé : mode demo Etherscan (~1 req/s, peut timeout)

---

## Limites connues

| Limite | Détail |
|---|---|
| 500 tx max | Etherscan free tier offset limit |
| ETH Mainnet uniquement | Pas de support BSC/Polygon dans cette version |
| Pas de données MEV | Nécessiterait Flashbots API |
| Labels d'adresses | Base statique — pas de lookup Etherscan labels API |
