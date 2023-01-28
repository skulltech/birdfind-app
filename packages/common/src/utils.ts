type ConcatStringArray<
  Strings extends readonly string[],
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Head extends string
    ? Rest extends readonly string[]
      ? ConcatStringArray<Rest, `${Acc}${Head}`>
      : Acc
    : Acc
  : Acc;

type Join<
  Strings extends readonly string[],
  Joiner extends string = ",",
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Rest extends readonly string[]
    ? Join<
        Rest,
        Joiner,
        Head extends string
          ? Acc extends ""
            ? Head
            : ConcatStringArray<readonly [Acc, Joiner, Head]>
          : never
      >
    : never
  : Acc;

export const join = <
  StrArr extends readonly string[],
  Sep extends string = ","
>(
  strings: StrArr,
  separator: Sep = "," as Sep
): Join<StrArr, Sep> => {
  return strings.join(separator) as Join<StrArr, Sep>;
};
