import { useEffect, useState } from 'react';
import { Auth, type IMatch, Match } from '@/lib/firebase';
import { Provider } from 'jotai';
import { create } from 'zustand';
import { produce } from 'immer';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Nullable } from '@/utils/types';
import { type User } from 'firebase/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { IcHome } from '@/components/icons/ic-home';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { get } from 'lodash';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/utils/cn';
import { IcMinus } from '@/components/icons/ic-minus';
import { IcPlus } from '@/components/icons/ic-plus';
import { Checkbox } from '@/components/ui/checkbox';

const useAuth = create<{
  user: Nullable<User>;
  setUser: (user: Nullable<User>) => void;
  status: 'loading' | 'authorized' | 'unauthorized';
  setStatus: (status: 'authorized' | 'unauthorized') => void;
}>(set => ({
  user: null,
  setUser: user =>
    set(state =>
      produce(state, draft => {
        draft.user = user;
      })
    ),
  status: 'loading',
  setStatus: status =>
    set(state =>
      produce(state, draft => {
        draft.status = status;
      })
    ),
}));

function useControl() {
  const [params, setParams] = useSearchParams();
  const key = 'm';
  const id = params.get(key);
  function navigate(id: string) {
    params.set(key, id);
    setParams(params);
  }
  return { id, key, navigate };
}

export default function Page() {
  const { id } = useControl();
  const status = useAuth(state => state.status);

  return (
    <Provider>
      {status !== 'loading' && (
        <div className="container h-full flex flex-col">
          <header className="flex justify-end items-center gap-2 pt-2 pb-0">
            <UserInfo />
            <AuthButton />
          </header>
          <nav className="p-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Button asChild>
                    <Link to="/">
                      <IcHome />
                    </Link>
                  </Button>
                </BreadcrumbItem>
                {id && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Match {id}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </nav>
          {status === 'authorized' && (
            <section className="hide-scrollbar min-h-0 flex-1 overflow-auto">
              {!id ? <Dashboard /> : <MatchBoard id={id} />}
            </section>
          )}
        </div>
      )}
      <AuthObserver />
    </Provider>
  );
}

const auth = new Auth();

function AuthObserver() {
  const setStatus = useAuth(state => state.setStatus);
  const setUser = useAuth(state => state.setUser);
  useEffect(() => {
    return auth.onStateChanged(user => {
      setStatus(!user ? 'unauthorized' : 'authorized');
      setUser(user);
    });
  }, [setStatus, setUser]);
  return null;
}

function UserInfo() {
  const user = useAuth(state => state.user);
  if (!user) return <p className="text-sm">Guest</p>;
  const email = user.email;
  if (!email) return <p className="text-sm">User {user.uid}</p>;
  return <div>{get(email.split('@'), 0)}</div>;
}

function AuthButton() {
  const user = useAuth(state => state.user);
  const [isOpen, setOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!user ? (
        <DialogTrigger asChild>
          <Button>Login</Button>
        </DialogTrigger>
      ) : (
        <Button onClick={auth.logout}>Logout</Button>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
        </DialogHeader>
        <LoginForm onSubmitted={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function LoginForm({ onSubmitted }: { onSubmitted: VoidFunction }) {
  const [error, setError] = useState('');
  const schema = z.object({
    email: z.string().trim().min(1).email(),
    password: z.string().trim().min(6).max(32),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'thanh.dinh@executionlab.asia', password: '123456' },
  });

  const onSubmit = form.handleSubmit(async payload => {
    try {
      await auth.login(payload.email, payload.password);
      onSubmitted();
    } catch {
      setError('Something went wrong!');
    }
  });

  const {
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </div>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Submit
        </Button>
        <p className="text-destructive">{error}</p>
      </form>
    </Form>
  );
}

const match = new Match();

function Dashboard() {
  const { navigate } = useControl();
  const { mutate, isPending } = useMutation({
    mutationFn: () => match.create().then(snapshot => snapshot.id),
    throwOnError: false,
    onSuccess(id) {
      navigate(id);
    },
  });
  return (
    <div className="flex justify-center">
      <Button disabled={isPending} onClick={() => mutate()}>
        Create
      </Button>
    </div>
  );
}

function MatchBoard({ id }: { id: string }) {
  const [data, setData] = useState<Nullable<IMatch>>(null);
  useEffect(() => {
    return match.onListener(id, setData);
  }, [id]);
  const [tab, setTab] = useState<'st' | 'nd' | 'rd'>('st');
  if (!data) return null;
  return (
    <Tabs
      value={tab}
      onValueChange={newValue => {
        if (newValue === 'st' || newValue === 'nd' || newValue === 'rd') setTab(newValue);
      }}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="st">st</TabsTrigger>
        <TabsTrigger value="nd">nd</TabsTrigger>
        <TabsTrigger value="rd">rd</TabsTrigger>
      </TabsList>
      <MatchBoardContent data={data} id={id} tab="st" />
      <MatchBoardContent data={data} id={id} tab="nd" />
      <MatchBoardContent data={data} id={id} tab="rd" />
    </Tabs>
  );
}

function MatchBoardContent({
  data,
  id,
  tab,
}: {
  data: IMatch;
  id: string;
  tab: 'st' | 'nd' | 'rd';
}) {
  return (
    <TabsContent value={tab} className="grid grid-cols-2 gap-1 mt-0">
      <Card className="mt-2">
        <div>
          <Dialog>
            <DialogTrigger className="w-full text-lg">{data.set[tab].name.a}</DialogTrigger>
            <DialogContent>
              <NameForm id={id} set="st" team="a" name={data.set.st.name.a} />
            </DialogContent>
          </Dialog>
          <p className="text-center text-4xl font-bold">{data.set.st.score.a}</p>
          <Dialog>
            <DialogTrigger asChild>
              <div className="px-2">
                <div className="flex items-center gap-2 justify-end">
                  <p>{data.set.st.player.a[0].name}</p>
                  <StartServe active={data.set.st.player.a[0].serve} />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <p>{data.set.st.player.a[1].name}</p>
                  <StartServe active={data.set.st.player.a[1].serve} />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <PlayerNameForm
                id={id}
                set="st"
                team="a"
                name1={data.set.st.player.a[0].name}
                name2={data.set.st.player.a[1].name}
              />
            </DialogContent>
          </Dialog>
        </div>
      </Card>
      <Card>
        <div>
          <Dialog>
            <DialogTrigger className="w-full text-lg">{data.set.st.name.b}</DialogTrigger>
            <DialogContent>
              <NameForm id={id} set="st" team="b" name={data.set.st.name.b} />
            </DialogContent>
          </Dialog>
          <p className="text-center text-4xl font-bold">{data.set.st.score.b}</p>
          <Dialog>
            <DialogTrigger asChild>
              <div className="px-2">
                <div className="flex items-center gap-2 justify-start">
                  <StartServe active={data.set.st.player.b[0].serve} />
                  <p>{data.set.st.player.b[0].name}</p>
                </div>
                <div className="flex items-center gap-2 justify-start">
                  <StartServe active={data.set.st.player.b[1].serve} />
                  <p>{data.set.st.player.b[1].name}</p>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <PlayerNameForm
                id={id}
                set="st"
                team="b"
                name1={data.set.st.player.b[0].name}
                name2={data.set.st.player.b[1].name}
              />
            </DialogContent>
          </Dialog>
        </div>
      </Card>
      <Drawer>
        <DrawerTrigger className="mt-2 col-span-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium">
          Setting
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <div className="p-4 pb-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex gap-1">
                    <Button size="icon" onClick={() => match.updateScore(id, 'st', 'a', -1)}>
                      <IcMinus />
                    </Button>
                    <div className="flex-1">
                      <p className="font-bold text-center text-4xl">{data.set.st.score.a}</p>
                    </div>
                    <Button size="icon" onClick={() => match.updateScore(id, 'st', 'a', 1)}>
                      <IcPlus />
                    </Button>
                  </div>
                  <div>
                    <div className="flex gap-2 justify-end">
                      <p>{data.set.st.player.a[0].name}</p>
                      <div>
                        <Checkbox
                          checked={data.set.st.player.a[0].serve}
                          onCheckedChange={checked => {
                            match.updatePlayer(
                              id,
                              'st',
                              produce(data, draft => {
                                draft.set.st.player.a[0].serve =
                                  checked === 'indeterminate' ? false : checked;
                                draft.set.st.player.a[1].serve = false;
                                draft.set.st.player.b[0].serve = false;
                                draft.set.st.player.b[1].serve = false;
                              }).set.st.player
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <p>{data.set.st.player.a[1].name}</p>
                      <div>
                        <Checkbox
                          checked={data.set.st.player.a[1].serve}
                          onCheckedChange={checked => {
                            match.updatePlayer(
                              id,
                              'st',
                              produce(data, draft => {
                                draft.set.st.player.a[0].serve = false;
                                draft.set.st.player.a[1].serve =
                                  checked === 'indeterminate' ? false : checked;
                                draft.set.st.player.b[0].serve = false;
                                draft.set.st.player.b[1].serve = false;
                              }).set.st.player
                            );
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        match.updatePlayer(
                          id,
                          'st',
                          produce(data, draft => {
                            draft.set.st.player.a.reverse();
                          }).set.st.player
                        );
                      }}
                    >
                      Swap
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="flex gap-1">
                    <Button size="icon" onClick={() => match.updateScore(id, 'st', 'b', -1)}>
                      <IcMinus />
                    </Button>
                    <div className="flex-1">
                      <p className="font-bold text-center text-4xl">{data.set.st.score.b}</p>
                    </div>
                    <Button size="icon" onClick={() => match.updateScore(id, 'st', 'b', 1)}>
                      <IcPlus />
                    </Button>
                  </div>
                  <div>
                    <div className="flex gap-2 justify-start">
                      <div>
                        <Checkbox
                          checked={data.set.st.player.b[0].serve}
                          onCheckedChange={checked => {
                            match.updatePlayer(
                              id,
                              'st',
                              produce(data, draft => {
                                draft.set.st.player.a[0].serve = false;
                                draft.set.st.player.a[1].serve = false;
                                draft.set.st.player.b[0].serve =
                                  checked === 'indeterminate' ? false : checked;
                                draft.set.st.player.b[1].serve = false;
                              }).set.st.player
                            );
                          }}
                        />
                      </div>
                      <p>{data.set.st.player.b[0].name}</p>
                    </div>
                    <div className="flex gap-2 justify-start">
                      <div>
                        <Checkbox
                          checked={data.set.st.player.b[1].serve}
                          onCheckedChange={checked => {
                            match.updatePlayer(
                              id,
                              'st',
                              produce(data, draft => {
                                draft.set.st.player.a[0].serve = false;
                                draft.set.st.player.a[1].serve = false;
                                draft.set.st.player.b[0].serve = false;
                                draft.set.st.player.b[1].serve =
                                  checked === 'indeterminate' ? false : checked;
                              }).set.st.player
                            );
                          }}
                        />
                      </div>
                      <p>{data.set.st.player.b[1].name}</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        match.updatePlayer(
                          id,
                          'st',
                          produce(data, draft => {
                            draft.set.st.player.b.reverse();
                          }).set.st.player
                        );
                      }}
                    >
                      Swap
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </TabsContent>
  );
}

function StartServe({ active }: { active: boolean }) {
  return <div className={cn('size-4 rounded-full', active && 'bg-green-500')} />;
}

function NameForm({
  id,
  set,
  team,
  name,
}: {
  id: string;
  set: 'st' | 'nd' | 'rd';
  team: 'a' | 'b';
  name: string;
}) {
  const schema = z.object({ name: z.string().min(1) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name },
  });
  const onSubmit = form.handleSubmit(async payload => {
    await match.updateName(id, set, team, payload.name);
    form.reset(payload);
  });

  const {
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="space-y-1">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Update
        </Button>
      </form>
    </Form>
  );
}

function PlayerNameForm({
  id,
  set,
  team,
  name1,
  name2,
}: {
  id: string;
  set: 'st' | 'nd' | 'rd';
  team: 'a' | 'b';
  name1: string;
  name2: string;
}) {
  const schema = z.object({ name1: z.string().min(1), name2: z.string().min(1) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name1, name2 },
  });
  const onSubmit = form.handleSubmit(async payload => {
    await match.updatePlayerName(id, set, team, payload.name1, payload.name2);
    form.reset(payload);
  });

  const {
    formState: { isSubmitting },
  } = form;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="name1"
            render={({ field }) => (
              <div className="space-y-1">
                <FormLabel>Name player 1</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />
          <FormField
            control={form.control}
            name="name2"
            render={({ field }) => (
              <div className="space-y-1">
                <FormLabel>Name player 2</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Update
        </Button>
      </form>
    </Form>
  );
}
