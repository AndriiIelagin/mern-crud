declare module 'string-capitalize-name' {
  function stringCapitalizeName(
    name: string,
    options?: { ignoreLessThanLength?: number },
  ): string;
  export = stringCapitalizeName;
}
