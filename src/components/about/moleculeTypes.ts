export type AtomType = string;

export interface MoleculeNode {
	id: number;
	type: AtomType;
	pos: [number, number, number];
}

export interface MoleculeEdge {
	source: number;
	target: number;
	order: 1 | 2 | 3 | 4;
}

export interface MoleculeData {
	nodes: MoleculeNode[];
	edges: MoleculeEdge[];
}
