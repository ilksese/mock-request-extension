import { sendMessage } from "@/utils/sendMessage";
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
  const removeRules = useCallback(async (ids: number[] | number) => {
    ids = Array.isArray(ids) ? ids : [ids];
    await sendMessage({ type: "removeDynamicRules", data: ids });
    setRules((old) => {
      return old.filter((o) => !ids.includes(o.id));
    });
  }, []);
  const updateRules = useCallback(async (update: ApiRuleItem[] | ApiRuleItem) => {
    update = Array.isArray(update) ? update : [update];
    await sendMessage({ type: "updateDynamicRules", data: update });
    setRules((old) => {
      return old.map((o) => {
        const up = update.find((up) => up.id === o.id);
        return up || o;
      });
    });
  }, []);
  const addRules = useCallback(async (add: ApiRuleItem[] | ApiRuleItem) => {
    add = Array.isArray(add) ? add : [add];
    await sendMessage({ type: "addDynamicRules", data: add });
    setRules((old) => add.concat(old));
  }, []);
  useEffect(() => {
    storage.getItem<ApiRuleItem[]>("local:rules").then((rules) => {
      if (rules) {
        _setRules(rules);
      }
    });
  }, []);
  return [rules, { setRules, removeRules, updateRules, addRules }] as const;
};
