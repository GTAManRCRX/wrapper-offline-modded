import type { Ref } from "vue";

export type GenericListEntry = {
	id: string,
	title: string
};

export interface ListFieldColumn<T extends GenericListEntry> {
	id: FieldIdOf<T>,
	width: Ref<number>,
};

export type FieldIdOf<T extends GenericListEntry> = keyof T;

export interface SelectedListSort<T extends GenericListEntry> {
	id: FieldIdOf<T>,
	descending: boolean,
};