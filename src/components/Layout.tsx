import { Box, Flex, VStack, Icon, IconButton, useColorMode, Text, Image, Button } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FiHome, FiBarChart2, FiFolder, FiGrid, FiHelpCircle, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, isActive = false, onClick }: SidebarItemProps) => {
  const { colorMode } = useColorMode();
  
  return (
    <Flex
      align="center"
      p={3}
      cursor={onClick ? "pointer" : "default"}
      color={
        colorMode === 'light'
          ? isActive ? 'blue.500' : 'gray.600'
          : isActive ? 'blue.200' : 'gray.400'
      }
      _hover={{
        bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
        color: colorMode === 'light' ? 'blue.500' : 'blue.200'
      }}
      borderRadius="md"
      bg={
        isActive
          ? colorMode === 'light' ? 'blue.50' : 'blue.900'
          : 'transparent'
      }
      mb={1}
      onClick={onClick}
      opacity={onClick ? 1 : 0.7}
    >
      <Icon as={icon} mr={3} />
      <Text fontSize="sm" fontWeight={isActive ? "semibold" : "medium"}>{label}</Text>
    </Flex>
  );
};

export default function Layout({ children }: LayoutProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user } = useAuth();
  const router = useRouter();

  const logoSrc = colorMode === 'light' ? '/images/logo.png' : '/images/logo-dark.png';

  return (
    <Flex minH="100vh" h="100%">
      {/* Sidebar */}
      <Box
        w="240px"
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRight="1px"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        py={5}
        px={3}
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        overflowY="auto"
      >
        {/* Logo Area */}
        <Flex align="center" mb={8} px={3} onClick={() => router.push('/')} cursor="pointer">
          <Box width="160px">
            <Image
              src={logoSrc}
              alt="Brandcast Logo"
              width="100%"
              height="auto"
              objectFit="contain"
            />
          </Box>
        </Flex>

        {/* Navigation */}
        <VStack align="stretch" spacing={1}>
          <SidebarItem 
            icon={FiHome} 
            label="Home" 
            isActive={router.pathname === '/'} 
            onClick={() => router.push('/')}
          />
          <SidebarItem 
            icon={FiBarChart2} 
            label="Evaluate" 
            isActive={router.pathname === '/evaluate'} 
            onClick={() => router.push('/evaluate')}
          />
          <SidebarItem 
            icon={FiFolder} 
            label="History" 
            isActive={router.pathname === '/history'} 
            onClick={() => router.push('/history')}
          />
          <SidebarItem 
            icon={FiBriefcase} 
            label="Company Profile" 
            isActive={router.pathname === '/company-profile'} 
            onClick={() => router.push('/company-profile')}
          />
        </VStack>
      </Box>

      {/* Main Content */}
      <Box 
        flex={1} 
        bg={colorMode === 'light' ? 'gray.50' : 'gray.900'} 
        minH="100vh"
        h="100%"
        position="relative"
        ml="240px" // Add margin to offset the fixed sidebar
      >
        {/* Header Bar */}
        <Box
          position="sticky"
          top={0}
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          borderBottom="1px"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          height="64px"
          zIndex={999}
        >
          <Flex
            maxW="1200px"
            mx="auto"
            h="full"
            align="center"
            justify="space-between"
            px={8}
          >
            {/* Left side - Page Title */}
            {getPageTitle(router.pathname) && (
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color={colorMode === 'light' ? 'gray.700' : 'white'}
              >
                {getPageTitle(router.pathname)}
              </Text>
            )}

            {/* Right side - Controls */}
            <Flex align="center" gap={4} ml="auto">
              <IconButton
                aria-label="Toggle theme"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
              />
              
              {user && (
                <Flex
                  align="center"
                  p={2}
                  cursor="pointer"
                  _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.700' }}
                  borderRadius="md"
                  onClick={() => router.push('/profile')}
                >
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                    mr={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                  >
                    {user.email?.[0].toUpperCase()}
                  </Box>
                  <Text 
                    fontSize="sm" 
                    fontWeight="medium" 
                    isTruncated 
                    maxW="200px"
                    color={colorMode === 'light' ? 'gray.700' : 'gray.100'}
                  >
                    {user.email}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Box>
        
        {/* Content */}
        <Box 
          p={8} 
          maxW="1200px" 
          mx="auto" 
          position="relative" 
          minH="calc(100vh - 64px)"
          h="100%"
        >
          {children}

          {/* Support Button */}
          <Flex
            position="fixed"
            bottom={6}
            right={6}
            zIndex={999}
          >
            <Button
              leftIcon={<Icon as={FiHelpCircle} />}
              onClick={() => router.push('/support')}
              colorScheme="blue"
              size="md"
              shadow="md"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
              transition="all 0.2s"
            >
              Support
            </Button>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}

// Helper function to get page title based on route
function getPageTitle(pathname: string): string {
  return ''; // Return empty string for all pages
} 