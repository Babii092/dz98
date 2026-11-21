import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createChat,
  getChatApiError,
  getChatTypes,
  IChatType,
  isUnauthorized,
  IUserShort,
} from "@/api/chatCreate";
import UserPicker from "@/components/chat/UserPicker";

const MAX_NAME = 200;

export default function CreateChatScreen() {
  const router = useRouter();

  const [types, setTypes] = useState<IChatType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [users, setUsers] = useState<IUserShort[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await getChatTypes();
      setTypes(data);
      setTypeId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      if (isUnauthorized(err)) {
        router.replace("/login");
        return;
      }
      setTypesError(getChatApiError(err));
    } finally {
      setTypesLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const selectedType = types.find((t) => t.id === typeId);
  const isPrivate = selectedType?.name.toLowerCase() === "private";

  const selectType = (id: number) => {
    setTypeId(id);
    setError(null);
    const type = types.find((t) => t.id === id);
    if (type?.name.toLowerCase() === "private" && users.length > 1) {
      setUsers(users.slice(0, 1));
    }
  };

  const validate = (): string | null => {
    if (!selectedType) return "Оберіть тип чату";
    if (isPrivate) {
      if (users.length !== 1) return "Для приватного чату оберіть одного користувача";
    } else {
      if (!name.trim()) return "Вкажіть назву чату";
      if (users.length < 1) return "Додайте хоча б одного учасника";
    }
    if (name.trim().length > MAX_NAME) return `Назва не довша за ${MAX_NAME} символів`;
    return null;
  };

  const onSubmit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (typeId === null) return;

    setError(null);
    setSubmitting(true);
    try {
      const chatName = name.trim() || (isPrivate ? users[0].name : "");
      await createChat({
        name: chatName,
        chatTypeId: typeId,
        userIds: users.map((u) => u.id),
      });
      router.replace("/chat/home");
    } catch (err) {
      if (isUnauthorized(err)) {
        router.replace("/login");
        return;
      }
      setError(getChatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (typesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (typesError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <Text className="mb-4 text-center text-base text-red-700">{typesError}</Text>
        <Pressable
          className="rounded-xl bg-indigo-600 px-6 py-3 active:bg-indigo-700"
          onPress={loadTypes}
        >
          <Text className="text-base font-semibold text-white">Спробувати ще раз</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 p-6">
      <Text className="mb-6 text-3xl font-bold text-slate-900">Новий чат</Text>

      <Text className="mb-2 text-sm font-medium text-slate-700">Тип чату</Text>
      <View className="mb-5 flex-row gap-2">
        {types.map((t) => {
          const active = t.id === typeId;
          return (
            <Pressable
              key={t.id}
              disabled={submitting}
              className={`rounded-full border px-4 py-2 ${
                active ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
              }`}
              onPress={() => selectType(t.id)}
            >
              <Text className={active ? "font-semibold text-white" : "text-slate-700"}>
                {t.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 text-sm font-medium text-slate-700">
        {isPrivate ? "Назва (необовʼязково)" : "Назва"}
      </Text>
      <TextInput
        className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
        placeholder={isPrivate ? "Імʼя співрозмовника" : "Назва чату"}
        placeholderTextColor="#94a3b8"
        maxLength={MAX_NAME}
        editable={!submitting}
        value={name}
        onChangeText={setName}
      />

      <Text className="mb-2 text-sm font-medium text-slate-700">
        {isPrivate ? "Співрозмовник" : "Учасники"}
      </Text>
      <UserPicker
        selected={users}
        onChange={setUsers}
        disabled={submitting}
        singleSelect={isPrivate}
      />

      {error && (
        <View className="mt-4 rounded-xl bg-red-50 p-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      )}

      <Pressable
        className="mt-6 items-center rounded-xl bg-indigo-600 py-3.5 active:bg-indigo-700 disabled:opacity-60"
        disabled={submitting}
        onPress={onSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">Створити чат</Text>
        )}
      </Pressable>

      <Pressable className="mt-3 items-center py-2" onPress={() => router.back()}>
        <Text className="text-base text-slate-600">Скасувати</Text>
      </Pressable>
    </View>
  );
}
