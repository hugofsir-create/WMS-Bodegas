/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Material {
  sku: string;
  descripcion: string;
  cajasPorPallet: number;
}

export interface InventoryItem {
  sku: string;
  cantidad: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  date: string;
  sku: string;
  tipo: 'ingreso' | 'egreso';
  uom: string;
  cantidad: number;
  warehouse: 'Escorihuela Gascón' | 'La Rural';
  estado: 'Apto' | 'No Apto';
}

export type WarehouseType = 'Escorihuela Gascón' | 'La Rural';
