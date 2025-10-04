
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Book } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuthError = (error: any) => {
    let title = 'Erro na Autenticação';
    let description = 'Ocorreu um erro. Por favor, tente novamente.';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        title = 'Credenciais Inválidas';
        description = 'O e-mail ou a senha estão incorretos. Verifique e tente novamente.';
        break;
      case 'auth/email-already-in-use':
        title = 'E-mail já cadastrado';
        description = 'Este e-mail já está em uso. Tente fazer login ou use um e-mail diferente.';
        break;
      case 'auth/invalid-email':
        title = 'E-mail Inválido';
        description = 'O formato do e-mail fornecido não é válido.';
        break;
      case 'auth/weak-password':
        title = 'Senha Fraca';
        description = 'Sua senha é muito fraca. Tente uma combinação mais forte.';
        break;
      default:
        console.error('Authentication Error:', error);
    }

    toast({
      variant: 'destructive',
      title,
      description,
    });
  };

  const handleLogin = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para sua biblioteca...',
      });
      // O useEffect cuidará do redirecionamento
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você está logado. Redirecionando para sua biblioteca...',
      });
      // O useEffect cuidará do redirecionamento
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Book className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Bem-vindo ao MangaTrack</CardTitle>
          <CardDescription>Faça login ou crie sua conta para sincronizar sua biblioteca na nuvem.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex flex-col gap-2 pt-2">
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSubmit(handleRegister)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">Criado por ArthurM</p>
        </CardFooter>
      </Card>
    </div>
  );
}
