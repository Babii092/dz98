import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { IUserShort, searchUsers } from "@/api/chatCreate";

interface Props {
  selected: IUserShort[];
  onChange: (users: IUserShort[]) => void;
  disabled?: boolean;
  singleSelect?: boolean;
}

const MIN_QUERY = 2;

export default function UserPicker({
  selected,
  onChange,
  disabled,
  singleSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUserShort[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(q);
        if (id !== requestId.current) return;
        setResults(users);
        setFailed(false);
      } catch {
        if (id !== requestId.current) return;
        setResults([]);
        setFailed(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const add = (user: IUserShort) => {
    if (disabled) return;
    onChange(singleSelect ? [user] : [...selected, user]);
    setQuery("");
    setResults([]);
  };

  const remove = (id: number) => {
    if (disabled) return;
    onChange(selected.filter((u) => u.id !== id));
  };

  const visible = results.filter((r) => !selected.some((s) => s.id === r.id));

  return (
    <View>
      {selected.length > 0 && (
        <View className="mb-3 flex-row flex-wrap gap-2">
          {selected.map((u) => (
            <Pressable
              key={u.id}
              className="flex-row items-center rounded-full bg-indigo-100 px-3 py-1.5"
              onPress={() => remove(u.id)}
            >
              <Text className="text-sm text-indigo-800">{u.name}</Text>
              <Text className="ml-2 text-sm font-bold text-indigo-800">×</Text>
            </Pressable>
          ))}
        </View>
      )}

      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
        placeholder="Пошук користувачів"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        value={query}
        onChangeText={setQuery}
      />

      {query.trim().length > 0 && query.trim().length < MIN_QUERY && (
        <Text className="mt-2 text-sm text-slate-500">
          Введіть щонайменше {MIN_QUERY} символи
        </Text>
      )}

      {loading && (
        <View className="mt-3 items-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      )}

      {failed && !loading && (
        <Text className="mt-2 text-sm text-red-600">
          Не вдалося виконати пошук
        </Text>
      )}

      {!loading &&
        !failed &&
        query.trim().length >= MIN_QUERY &&
        visible.length === 0 && (
          <Text className="mt-2 text-sm text-slate-500">
            Нікого не знайдено
          </Text>
        )}

      {visible.length > 0 && (
        <View className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {visible.map((u, index) => (
            <Pressable
              key={u.id}
              className={`px-4 py-3 active:bg-slate-100 ${
                index > 0 ? "border-t border-slate-100" : ""
              }`}
              onPress={() => add(u)}
            >
              <Text className="text-base text-slate-900">{u.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
