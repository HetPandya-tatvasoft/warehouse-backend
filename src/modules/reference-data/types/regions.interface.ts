export interface ICountryItem {
  id: number;
  name: string;
  iso2: string;
  states: IStateItem[];
}

export interface IStateItem {
  id: number;
  name: string;
  state_code: string;
  cities: ICityItem[];
}

export interface ICityItem {
  id: number;
  name: string;
}
