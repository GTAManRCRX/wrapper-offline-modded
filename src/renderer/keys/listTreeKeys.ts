import { InjectionKey } from "vue";

const columnIdKey = Symbol();

export const genericColumnIdKey = <T>() => columnIdKey as InjectionKey<(keyof T)[]>;