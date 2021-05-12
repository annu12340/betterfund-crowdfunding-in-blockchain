import Head from "next/head";
import { useState, useEffect } from "react";
import { useWallet } from "use-wallet";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useWindowSize } from "react-use";
import {
  Box,
  Flex,
  Stack,
  Heading,
  Text,
  Container,
  Input,
  Button,
  SimpleGrid,
  InputRightAddon,
  InputGroup,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Tooltip,
  Alert,
  AlertIcon,
  AlertDescription,
  Icon,
  Progress,
  CloseButton,
} from "@chakra-ui/react";
import { FaCopy, FaTwitter } from "react-icons/fa";
import { InfoIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import Confetti from "react-confetti";

import web3 from "../../smart-contract/web3";
import Campaign from "../../smart-contract/campaign";
import factory from "../../smart-contract/factory";

export async function getStaticPaths() {
  const campaigns = await factory.methods.getDeployedCampaigns().call();

  console.log(campaigns);
  const paths = campaigns.map((campaign, i) => ({
    params: { id: campaigns[i] },
  }));
  console.log("paths", paths);

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const campaignId = params.id;
  const campaign = Campaign(campaignId);
  const summary = await campaign.methods.getSummary().call();

  return {
    props: {
      id: campaignId,
      minimumContribution: summary[0],
      balance: summary[1],
      requestsCount: summary[2],
      approversCount: summary[3],
      manager: summary[4],
      name: summary[5],
      description: summary[6],
      image: summary[7],
      target: summary[8],
    },
  };
}

function StatsCard(props) {
  const { title, stat, info } = props;
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={"5"}
      shadow={"sm"}
      border={"1px solid"}
      borderColor={"gray.500"}
      rounded={"lg"}
      transition={"transform 0.3s ease"}
      _hover={{
        transform: "translateY(-5px)",
      }}
    >
      <Tooltip
        label={info}
        bg={useColorModeValue("white", "gray.700")}
        placement={"top"}
        color={useColorModeValue("gray.800", "white")}
        fontSize={"1em"}
      >
        <Flex justifyContent={"space-between"}>
          <Box pl={{ base: 2, md: 4 }}>
            <StatLabel fontWeight={"medium"} isTruncated>
              {title}
            </StatLabel>
            <StatNumber
              fontSize={"base"}
              fontWeight={"bold"}
              isTruncated
              maxW={{ base: "	10rem", sm: "sm" }}
            >
              {stat}
            </StatNumber>
          </Box>
        </Flex>
      </Tooltip>
    </Stat>
  );
}

export default function CampaignSingle({
  id,
  minimumContribution,
  balance,
  requestsCount,
  approversCount,
  manager,
  name,
  description,
  image,
  target,
}) {
  const { handleSubmit, register, formState, reset } = useForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const wallet = useWallet();
  const router = useRouter();
  const { width, height } = useWindowSize();
  async function onSubmit(data) {
    console.log(data);
    try {
      const campaign = Campaign(id);
      const accounts = await web3.eth.getAccounts();
      await campaign.methods.contibute().send({
        from: accounts[0],
        value: web3.utils.toWei(data.value, "ether"),
      });
      router.push(`/campaign/${id}`);
      reset("", {
        keepValues: false,
      });
      setIsSubmitted(true);
      setError(false);
    } catch (err) {
      setError(err.message);
      console.log(err);
    }
  }

  return (
    <div>
      <Head>
        <title>Campaign Details</title>
        <meta name="description" content="Create a Withdrawal Request" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isSubmitted ? <Confetti width={width} height={height} /> : null}
      <main>
        {" "}
        <Box position={"relative"}>
          {isSubmitted ? (
            <Container
              maxW={"7xl"}
              columns={{ base: 1, md: 2 }}
              spacing={{ base: 10, lg: 32 }}
              py={{ base: 6 }}
            >
              <Alert status="success" mt="2">
                <AlertIcon />
                <AlertDescription mr={2}>
                  {" "}
                  Thank You for your Contribution 🙏
                </AlertDescription>
                <CloseButton
                  position="absolute"
                  right="8px"
                  top="8px"
                  onClick={() => setIsSubmitted(false)}
                />
              </Alert>
            </Container>
          ) : null}
          <Container
            as={SimpleGrid}
            maxW={"7xl"}
            columns={{ base: 1, md: 2 }}
            spacing={{ base: 10, lg: 32 }}
            py={{ base: 6 }}
          >
            <Stack spacing={{ base: 6 }}>
              <Heading
                lineHeight={1.1}
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
              >
                {name}
              </Heading>
              <Text
                color={useColorModeValue("gray.500", "gray.200")}
                fontSize={{ base: "lg" }}
              >
                {description}
              </Text>
              <Box mx={"auto"} w={"full"}>
                <SimpleGrid columns={{ base: 1 }} spacing={{ base: 5 }}>
                  <StatsCard
                    title={"Minimum Contribution in Wei"}
                    stat={minimumContribution}
                    info={
                      "You must contribute at least this much in Wei ( 1 ETH = 10 ^ 18 Wei) to become an approver"
                    }
                  />
                  <StatsCard
                    title={"Wallet Address of Campaign Creator"}
                    stat={manager}
                    info={
                      "The Campaign Creator created the campaign and can create requests to withdraw money."
                    }
                  />
                  <StatsCard
                    title={"Number of Requests"}
                    stat={requestsCount}
                    info={
                      "A request tries to withdraw money from the contract. Requests must be approved by approvers"
                    }
                  />
                  <StatsCard
                    title={"Number of Approvers"}
                    stat={approversCount}
                    info={
                      "Number of people who have already donated to this campaign"
                    }
                  />
                </SimpleGrid>
              </Box>
            </Stack>
            <Stack spacing={{ base: 4 }}>
              <Stat
                bg={useColorModeValue("white", "gray.700")}
                boxShadow={"lg"}
                rounded={"xl"}
                p={{ base: 4, sm: 6, md: 8 }}
                spacing={{ base: 8 }}
              >
                <StatLabel fontWeight={"medium"}>
                  <Text as="span" isTruncated mr={2}>
                    {" "}
                    Campaign Balance
                  </Text>
                  <Tooltip
                    label="The balance is how much money this campaign has left to
                  spend."
                    bg={useColorModeValue("white", "gray.700")}
                    placement={"top"}
                    color={useColorModeValue("gray.800", "white")}
                    fontSize={"1em"}
                    px="4"
                  >
                    <InfoIcon color={useColorModeValue("teal.800", "white")} />
                  </Tooltip>
                </StatLabel>
                <StatNumber>
                  <Text
                    fontSize={"2xl"}
                    fontWeight={"bold"}
                    isTruncated
                    maxW={{ base: "	15rem", sm: "sm" }}
                    pt="2"
                  >
                    {balance > 0
                      ? web3.utils.fromWei(balance, "ether")
                      : "0, Become a Donor 😄"}
                    <Text as="span" display={balance > 0 ? "inline" : "none"}>
                      {" "}
                      ETH
                    </Text>
                  </Text>

                  <Text fontSize={"md"} fontWeight="normal">
                    target of <Text as="span">{target} ETH</Text>
                  </Text>
                  <Progress
                    colorScheme="teal"
                    size="sm"
                    value={web3.utils.fromWei(balance, "ether")}
                    max={target}
                    mt={4}
                  />
                </StatNumber>
              </Stat>

              <Stack
                bg={useColorModeValue("white", "gray.700")}
                boxShadow={"lg"}
                rounded={"xl"}
                p={{ base: 4, sm: 6, md: 8 }}
                spacing={{ base: 6 }}
              >
                <Stack spacing={4}>
                  <Heading
                    lineHeight={1.1}
                    fontSize={{ base: "2xl", sm: "3xl" }}
                    color={useColorModeValue("teal.600", "teal.400")}
                  >
                    Contribute Now!
                  </Heading>
                </Stack>
                <Box mt={10}>
                  <Stack spacing={4}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <FormControl id="value">
                        <FormLabel>
                          Amount in Ether you want to contribute
                        </FormLabel>
                        <InputGroup>
                          {" "}
                          <Input {...register("value")} />{" "}
                          <InputRightAddon children="ETH" />
                        </InputGroup>
                      </FormControl>

                      {error ? (
                        <Alert status="error" mt="2">
                          <AlertIcon />
                          <AlertDescription mr={2}> {error}</AlertDescription>
                        </Alert>
                      ) : null}

                      <Stack spacing={10}>
                        {wallet.status === "connected" ? (
                          <Button
                            fontFamily={"heading"}
                            mt={4}
                            w={"full"}
                            bgGradient="linear(to-r, teal.400,green.400)"
                            color={"white"}
                            _hover={{
                              bgGradient: "linear(to-r, teal.400,blue.400)",
                              boxShadow: "xl",
                            }}
                            isLoading={formState.isSubmitting}
                            type="submit"
                          >
                            Contribute
                          </Button>
                        ) : (
                          <Alert status="warning" mt={4}>
                            <AlertIcon />
                            <AlertDescription mr={2}>
                              Please Connect Your Wallet to Contribute
                            </AlertDescription>
                          </Alert>
                        )}
                      </Stack>
                    </form>
                  </Stack>
                </Box>
              </Stack>

              <Stack
                bg={useColorModeValue("white", "gray.700")}
                boxShadow={"lg"}
                rounded={"xl"}
                p={{ base: 4, sm: 6, md: 8 }}
                spacing={{ base: 8 }}
              >
                <Stack spacing={4}>
                  <Button
                    fontFamily={"heading"}
                    w={"full"}
                    bgGradient="linear(to-r, teal.400,green.400)"
                    color={"white"}
                    _hover={{
                      bgGradient: "linear(to-r, teal.400,blue.400)",
                      boxShadow: "xl",
                    }}
                  >
                    <NextLink href={`/campaign/${id}/requests`}>
                      View Withdrawal Requests
                    </NextLink>
                  </Button>
                  <Text fontSize={"sm"}>
                    * You can see where these funds are being used & if you have
                    contributed you can also approve those Withdrawal Requests
                    :)
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </main>
    </div>
  );
}
