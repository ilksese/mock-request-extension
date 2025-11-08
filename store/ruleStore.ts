import { atom, useAtom } from "jotai";

export interface ApiRuleItem {
  id: number;
  path: string;
  method: string;
  enabled: boolean;
  mock: string;
}

const ruleAtom = atom<ApiRuleItem[]>([]);

export const useRules = () => {
  const [rules, _setRules] = useAtom(ruleAtom);
  const setRules = useCallback<typeof _setRules>((rules) => {
    const action =
      typeof rules === "function"
        ? (old: ApiRuleItem[]) => {
            const newRule = rules(old);
            storage.setItem("local:rules", newRule);
            return newRule;
          }
        : () => {
            storage.setItem("local:rules", rules);
            return rules;
          };
    _setRules(action);
  }, []);
  useEffect(() => {
    storage.getItem<ApiRuleItem[]>("local:rules").then((rules) => {
      if (rules) {
        _setRules(rules);
      }
    });
  }, []);
  return [rules, setRules] as const;
};
