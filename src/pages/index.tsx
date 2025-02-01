import { useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Input, Text, VStack, useToast } from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { user, signup, login, logout } = useAuth();
  const toast = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsLogin(true); // Ensure we show login page after logout
  };

  if (user) {
    return (
      <Container maxW="container.md" py={10}>
        <VStack spacing={4}>
          <Text fontSize="2xl">Hello World!</Text>
          <Text>You are signed in as: {user.email}</Text>
          <Text fontSize="sm" color="gray.600">User ID: {user.uid}</Text>
          <Button onClick={handleLogout}>Log Out</Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack as="form" spacing={4} onSubmit={handleAuth}>
        <Text fontSize="2xl">{isLogin ? 'Login' : 'Register'}</Text>
        
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        <Button type="submit" colorScheme="blue" width="full">
          {isLogin ? 'Login' : 'Register'}
        </Button>

        <Button
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </Button>
      </VStack>
    </Container>
  );
}
