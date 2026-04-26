import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/**
 * 说明：
 * - 从 PubChem 拉取 3D 结构（无 3D 时回退 2D）
 * - 校验分子式是否与期望一致
 * - 默认过滤氢原子，仅输出骨架 + 杂原子（适配键线式渲染）
 * - 输出 generatedMolecules.ts 与 moleculeValidationReport.json
 */

const CATALOG = [
	{ key: 'aspirin', query: 'aspirin', expectedFormula: 'C9H8O4' },
	{ key: 'paracetamol', query: 'paracetamol', expectedFormula: 'C8H9NO2' },
	{ key: 'ibuprofen', query: 'ibuprofen', expectedFormula: 'C13H18O2' },
	{ key: 'naproxen', query: 'naproxen', expectedFormula: 'C14H14O3' },
	{ key: 'diclofenac', query: 'diclofenac', expectedFormula: 'C14H11Cl2NO2' },
	{ key: 'ketamine', query: 'ketamine', expectedFormula: 'C13H16ClNO' },
	{ key: 'procaine', query: 'procaine', expectedFormula: 'C13H20N2O2' },
	{ key: 'caffeine', query: 'caffeine', expectedFormula: 'C8H10N4O2' },
	{ key: 'dopamine', query: 'dopamine', expectedFormula: 'C8H11NO2' },
	{ key: 'serotonin', query: 'serotonin', expectedFormula: 'C10H12N2O' },
	{ key: 'penicillinG', query: 'penicillin g', expectedFormula: 'C16H18N2O4S' },
	{ key: 'amoxicillin', query: 'amoxicillin', expectedFormula: 'C16H19N3O5S' },
	{ key: 'nicotine', query: 'nicotine', expectedFormula: 'C10H14N2' },
	{ key: 'morphine', query: 'morphine', expectedFormula: 'C17H19NO3' },
	{ key: 'codeine', query: 'codeine', expectedFormula: 'C18H21NO3' },
	{ key: 'quinine', query: 'quinine', expectedFormula: 'C20H24N2O2' },
	{ key: 'glucose', query: 'D-glucose', expectedFormula: 'C6H12O6' },
	{ key: 'vitaminC', query: 'L-ascorbic acid', expectedFormula: 'C6H8O6' },
	{ key: 'testosterone', query: 'testosterone', expectedFormula: 'C19H28O2' },
	{ key: 'estradiol', query: 'estradiol', expectedFormula: 'C18H24O2' },
	{ key: 'progesterone', query: 'progesterone', expectedFormula: 'C21H30O2' },
	{ key: 'cortisol', query: 'cortisol', expectedFormula: 'C21H30O5' },
	{ key: 'epinephrine', query: 'epinephrine', expectedFormula: 'C9H13NO3' },
	{ key: 'histamine', query: 'histamine', expectedFormula: 'C5H9N3' },
	{ key: 'gaba', query: 'gamma-aminobutyric acid', expectedFormula: 'C4H9NO2' },
	{ key: 'lidocaine', query: 'lidocaine', expectedFormula: 'C14H22N2O' },
	{ key: 'metformin', query: 'metformin', expectedFormula: 'C4H11N5' },
	{ key: 'warfarin', query: 'warfarin', expectedFormula: 'C19H16O4' },
	{ key: 'chloroquine', query: 'chloroquine', expectedFormula: 'C18H26ClN3' },
	{ key: 'artemisinin', query: 'artemisinin', expectedFormula: 'C15H22O5' },
];

const ELEMENTS = {
	1: 'H',
	6: 'C',
	7: 'N',
	8: 'O',
	9: 'F',
	15: 'P',
	16: 'S',
	17: 'Cl',
	35: 'Br',
	53: 'I',
};

const INCLUDE_HYDROGEN = false;

function slugEncode(name) {
	return encodeURIComponent(name);
}

async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} for ${url}`);
	}
	return res.json();
}

function round3(n) {
	return Math.round(n * 1000) / 1000;
}

function normalizeFormula(s) {
	return String(s ?? '').replace(/\s+/g, '').toUpperCase();
}

function getConformer(compound) {
	const coords = compound?.coords ?? [];
	if (!coords.length) return null;
	return coords[0]?.conformers?.[0] ?? null;
}

function convertToMoleculeData(compound) {
	const aids = compound.atoms?.aid ?? [];
	const atomicNums = compound.atoms?.element ?? [];
	const conformer = getConformer(compound);
	if (!conformer) throw new Error('No conformer found.');

	const xs = conformer.x ?? [];
	const ys = conformer.y ?? [];
	const zs = conformer.z ?? new Array(xs.length).fill(0);
	if (xs.length !== aids.length || ys.length !== aids.length || zs.length !== aids.length) {
		throw new Error('Coordinate length mismatch with atom list.');
	}

	const oldAidToNewId = new Map();
	const nodes = [];
	for (let i = 0; i < aids.length; i++) {
		const aid = aids[i];
		const atomicNum = atomicNums[i];
		const symbol = ELEMENTS[atomicNum] ?? `E${atomicNum}`;
		if (!INCLUDE_HYDROGEN && symbol === 'H') continue;
		const id = nodes.length;
		oldAidToNewId.set(aid, id);
		nodes.push({
			id,
			type: symbol,
			pos: [round3(xs[i]), round3(ys[i]), round3(zs[i])],
		});
	}

	const a1 = compound.bonds?.aid1 ?? [];
	const a2 = compound.bonds?.aid2 ?? [];
	const order = compound.bonds?.order ?? [];
	const edges = [];
	for (let i = 0; i < a1.length; i++) {
		const source = oldAidToNewId.get(a1[i]);
		const target = oldAidToNewId.get(a2[i]);
		if (source == null || target == null) continue;
		const ordRaw = Number(order[i] ?? 1);
		const ord = ordRaw === 2 || ordRaw === 3 || ordRaw === 4 ? ordRaw : 1;
		edges.push({ source, target, order: ord });
	}

	return { nodes, edges };
}

async function fetchMolecule(entry) {
	const q = slugEncode(entry.query);
	const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${q}/property/MolecularFormula/JSON`;
	const formulaJson = await fetchJson(formulaUrl);
	const properties = formulaJson?.PropertyTable?.Properties ?? [];
	if (!properties.length) throw new Error('No molecular formula returned.');
	const formula = properties[0].MolecularFormula;

	let recordJson;
	let recordType = '3d';
	try {
		const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${q}/record/JSON?record_type=3d`;
		recordJson = await fetchJson(url3d);
	} catch {
		recordType = '2d';
		const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${q}/record/JSON?record_type=2d`;
		recordJson = await fetchJson(url2d);
	}

	const compound = recordJson?.PC_Compounds?.[0];
	if (!compound) throw new Error('No compound record returned.');
	const cid = compound?.id?.id?.cid ?? null;
	const data = convertToMoleculeData(compound);

	return {
		key: entry.key,
		query: entry.query,
		cid,
		recordType,
		expectedFormula: entry.expectedFormula,
		actualFormula: formula,
		formulaMatched: normalizeFormula(formula) === normalizeFormula(entry.expectedFormula),
		data,
	};
}

function toTsModule(results) {
	const lines = [];
	lines.push("import type { MoleculeData } from '../moleculeTypes';");
	lines.push('');
	lines.push('/**');
	lines.push(' * Auto-generated by scripts/import-molecules-from-pubchem.mjs');
	lines.push(' * Source: PubChem PUG REST');
	lines.push(' */');
	lines.push('export const importedMolecules: Record<string, MoleculeData> = {');
	for (const r of results) {
		lines.push(`\t${r.key}: ${JSON.stringify(r.data)},`);
	}
	lines.push('};');
	lines.push('');
	lines.push('export const importedMoleculeMeta = {');
	for (const r of results) {
		lines.push(
			`\t${r.key}: { cid: ${JSON.stringify(r.cid)}, query: ${JSON.stringify(r.query)}, recordType: ${JSON.stringify(
				r.recordType,
			)}, formula: ${JSON.stringify(r.actualFormula)} },`,
		);
	}
	lines.push('} as const;');
	lines.push('');
	return `${lines.join('\n')}\n`;
}

async function main() {
	const outDir = path.resolve('src/components/about/molecules');
	await fs.mkdir(outDir, { recursive: true });

	const results = [];
	for (const entry of CATALOG) {
		const result = await fetchMolecule(entry);
		results.push(result);
		process.stdout.write(
			`[ok] ${entry.key} | formula=${result.actualFormula} | expected=${entry.expectedFormula} | record=${result.recordType}\n`,
		);
	}

	const moduleText = toTsModule(results);
	await fs.writeFile(path.join(outDir, 'generatedMolecules.ts'), moduleText, 'utf8');

	const report = {
		generatedAt: new Date().toISOString(),
		includeHydrogen: INCLUDE_HYDROGEN,
		total: results.length,
		allFormulaMatched: results.every((r) => r.formulaMatched),
		items: results.map((r) => ({
			key: r.key,
			query: r.query,
			cid: r.cid,
			recordType: r.recordType,
			expectedFormula: r.expectedFormula,
			actualFormula: r.actualFormula,
			formulaMatched: r.formulaMatched,
			nodeCount: r.data.nodes.length,
			edgeCount: r.data.edges.length,
		})),
	};
	await fs.writeFile(path.join(outDir, 'moleculeValidationReport.json'), JSON.stringify(report, null, 2), 'utf8');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
