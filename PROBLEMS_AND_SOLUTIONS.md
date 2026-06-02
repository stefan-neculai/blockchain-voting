# Probleme Întâmpinate și Soluții Implementate

## Introducere

Integrarea criptografiei avansate (ZK-SNARKs) într-o aplicație descentralizată introduce o complexitate semnificativă, generând un set unic de provocări tehnice care nu există în dezvoltarea web tradițională. Efortul de dezvoltare s-a concentrat pe balansarea trinomului: Confidențialitate, Cost (Gas) și Experiența Utilizatorului (UX).

---

## 1. Costurile de Execuție On-Chain

### Problema
Verificarea unei dovezi ZK pe Ethereum este o operațiune costisitoare din punct de vedere computațional. Costul pentru a exprima un singur vot anonim depășește semnificativ costul unei tranzacții standard, riscând să facă sistemul impracticabil financiar pe rețeaua principală (Mainnet).

### Soluția
Am optat pentru utilizarea sistemului de demonstrație Groth16 în detrimentul unor alternative mai moderne precum PLONK sau STARKs. Deși Groth16 necesită un "Trusted Setup" per circuit, acesta oferă cele mai mici dimensiuni ale dovezii (doar 8 elemente on-chain) și cel mai mic cost de verificare (~200k-300k Gas). În comparație, PLONK ar fi eliminat necesitatea trusted setup-ului, dar ar fi dublat costurile de gaz.

### Comparație Costuri
| Tip Tranzacție | Cost Estimativ (Gas) | Cost în ETH | Cost în USD |
|----------------|---------------------|-------------|-------------|
| Vot Simplu | 45,000 | 0.0009 | $2.70 |
| Vot Anonim ZK | 350,000 | 0.007 | $21 |

Deși costul este de aproximativ 7 ori mai mare, acesta este prețul necesar pentru garantarea anonimității matematice.

---

## 2. Sincronizarea Arborelui Merkle

### Problema
Pentru a genera o dovadă validă, clientul (browserul) trebuie să cunoască starea exactă a arborelui Merkle - toate commitment-urile votanților înregistrați. Dacă un alt utilizator se înregistrează în timp ce clientul generează dovada, rădăcina arborelui se schimbă și dovada devine invalidă.

### Soluția
Implementarea unui pattern de Event Sourcing. La momentul votării, aplicația interoghează blockchain-ul pentru toate evenimentele `VoterRegistered` ale sondajului respectiv:

```javascript
const filter = contract.filters.VoterRegistered(pollId);
const events = await contract.queryFilter(filter);
const members = events.map(e => BigInt(e.args.identityCommitment));
```

Arborele Merkle este reconstruit local din aceste commitment-uri folosind biblioteca Semaphore SDK. Dacă între generarea dovezii și trimiterea tranzacției un nou votant este înregistrat, contractul va respinge dovada (rădăcina nu corespunde), iar utilizatorul trebuie să reîncerce.

---

## 3. Latența în Generarea Dovezilor

### Problema
Generarea dovezii implică operațiuni matematice complexe pe curbe eliptice (BN254). Pe dispozitive, acest proces poate dura între 2 și 10 secunde, timp în care teoretic firul principal de execuție al browserului s-ar putea bloca.

### Soluția
Interfața rămâne responsivă datorită:
- Animațiilor CSS gestionate de GPU (spinner-ul continuă să se rotească)
- Naturii asincrone a modulului WebAssembly care cedează periodic controlul browserului
- Sistemului de Loading States care afișează progresul curent ("Generating zero-knowledge proof... This may take a few seconds.")

Pentru aplicații cu cerințe mai stricte de performanță, ar putea fi implementați Web Workers pentru a muta complet procesarea în fire de execuție separate.

---

## 4. Limitarea Anonimității la Nivel de Rețea (Relayer Problem)

### Problema
Aceasta este cea mai importantă provocare teoretică. Deși conținutul votului este anonim (nimeni nu știe cine a votat pentru care opțiune), tranzacția de vot trebuie trimisă de o adresă Ethereum care plătește taxa de gaz. Un observator poate vedea că adresa 0xABC... a interacționat cu contractul de votare la o anumită oră.

### Abordarea Curentă
Anonimitatea este garantată la nivel de conținut al votului (Secret Ballot), dar nu complet la nivel de participare.

### Soluție Viitoare Identificată
Implementarea unui Relayer - un server care primește dovada și o trimite pe blockchain, plătind gazul în locul utilizatorului. Aceasta ar rupe complet legătura dintre wallet-ul votantului și tranzacție, dar introduce un element de centralizare și încredere.

---

## 5. Persistența Identității în Browser

### Problema
Identitatea criptografică (secret + commitment) este stocată în localStorage-ul browserului. Dacă utilizatorul șterge datele browser-ului sau schimbă dispozitivul, pierde accesul la identitate și implicit dreptul de vot în sondajele pentru care era înregistrat.

### Soluția
Implementarea a trei mecanisme complementare:

1. **Derivare Deterministă**: Identitatea poate fi regenerată din semnătura wallet-ului folosind standardul EIP-712. Același wallet conectat va produce aceeași identitate.

2. **Export/Import JSON**: Funcționalitate de backup care permite exportul identității într-un fișier JSON și importul pe alt dispozitiv.

3. **Avertismente UX**: Interfața afișează mesaje clare despre importanța backup-ului identității.

---

## 6. Dimensiunea Fișierelor de Circuit

### Problema
Cheile de demonstrare Groth16 (proving keys) au dimensiuni semnificative (~50MB pentru circuitul Semaphore). Prima votare necesită descărcarea acestor fișiere.

### Soluția
- Fișierele sunt încărcate lazy (doar când utilizatorul inițiază votul)
- Browser-ul le cache-uiește pentru utilizări ulterioare
- Interfața afișează progres în timpul încărcării

---

## 7. Deanonimizarea Creatorului de Sondaj

### Problema
Crearea unui sondaj este o acțiune publică - adresa wallet-ului creatorului este vizibilă pe blockchain. Doar votarea este anonimă.

### Abordarea
Aceasta este o limitare acceptată și documentată. Utilizatorii sunt informați că:
- Crearea sondajelor expune adresa wallet-ului
- Votarea (inclusiv în propriul sondaj) rămâne anonimă

---

## 8. Compatibilitate ethers.js v6 și BigInt

### Problema
Migrarea de la ethers.js v5 la v6 a introdus schimbări semnificative. V6 folosește `BigInt` nativ în loc de clasa `BigNumber`, ceea ce a cauzat incompatibilități cu Semaphore SDK.

### Soluția
Conversia explicită folosind `BigInt()` la extragerea valorilor din evenimente și la interacțiunea cu SDK-ul:

```javascript
const members = events.map(event => BigInt(event.args.identityCommitment));
```

---

## 9. Migrarea la Semaphore Protocol v4

### Problema
Semaphore v4 a introdus schimbări majore în API față de v3:
- Structura clasei Identity modificată
- Metode diferite pentru Group
- Format nou pentru dovezi

### Soluția
Refactorizarea completă a modulului de integrare Semaphore, adaptând:
- Importurile și instanțierea claselor
- Formatul proof-ului pentru contract
- Metodele de verificare

---

## 10. Desincronizarea LocalStorage după Reset Blockchain

### Problema
Aplicația folosește localStorage pentru a urmări local în ce sondaje a votat utilizatorul (pentru UX - afișarea mesajului "Ai votat deja"). Când blockchain-ul local (Hardhat) este resetat, starea on-chain se șterge, dar localStorage persistă, creând o desincronizare.

### Abordarea
Aceasta este o limitare acceptată pentru mediul de dezvoltare. Protecția reală împotriva votului dublu este on-chain (nullifier-ul), nu în localStorage. Utilizatorii pot șterge manual localStorage-ul sau datele site-ului pentru a reseta starea locală.

---

## 11. Design-ul Scope-ului pentru Nullifier

### Problema
Nullifier-ul previne votul dublu, dar trebuie să fie unic per sondaj, nu global. Un utilizator trebuie să poată vota în multiple sondaje, dar doar o dată în fiecare.

### Soluția
Utilizarea parametrului `scope` din Semaphore setat la ID-ul sondajului:

```javascript
const proof = await generateProof(
  identity,
  group,
  optionIndex,  // message: opțiunea votată
  pollId        // scope: asigură nullifier unic per sondaj
);
```

Astfel, același utilizator generează nullifier-uri diferite pentru sondaje diferite.

---

## 12. Tranzacții Multiple la Crearea Sondajului

### Problema
Crearea unui sondaj cu auto-înregistrare necesită două tranzacții separate:
1. `createPoll()` - creează sondajul
2. `registerVoter()` - înregistrează creatorul ca votant

Aceasta poate crea confuzie pentru utilizatori.

### Soluția
- Interfața afișează clar progresul ambelor etape
- Mesaje de status distincte: "Creating poll..." apoi "Registering you as a voter..."
- Dacă a doua tranzacție eșuează, sondajul rămâne creat și utilizatorul poate încerca înregistrarea manual

---

## 13. Timing Attacks pe Evenimente

### Problema Teoretică
Un observator poate vedea când sunt emise evenimentele `VoterRegistered`, corelând potențial momentul înregistrării cu identitatea off-chain a utilizatorului.

### Abordare
Aceasta este o limitare inerentă blockchain-urilor publice. Mitigări posibile (neimplementate):
- Batch registration de către administrator
- Înregistrare cu delay randomizat
- Utilizarea unui relayer și pentru înregistrare

---

## Concluzii

Dezvoltarea unui sistem de vot anonim pe blockchain implică navigarea unui spațiu complex de compromisuri între securitate, cost și experiență utilizator. Soluțiile implementate prioritizează anonimitatea matematică a votului, acceptând anumite limitări la nivel de rețea și UX care pot fi adresate în iterații viitoare prin implementarea unui sistem de relayer și optimizări suplimentare.
