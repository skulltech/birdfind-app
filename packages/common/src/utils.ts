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

type JoinStrings<
  Strings extends readonly string[],
  Joiner extends string = ",",
  Acc extends string = ""
> = Strings extends readonly [infer Head, ...infer Rest]
  ? Rest extends readonly string[]
    ? JoinStrings<
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

export const joinStrings = <
  StrArr extends readonly string[],
  Sep extends string = ","
>(
  strings: StrArr,
  separator: Sep = "," as Sep
): JoinStrings<StrArr, Sep> => {
  return strings.join(separator) as JoinStrings<StrArr, Sep>;
};
