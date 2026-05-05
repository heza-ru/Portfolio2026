# Goblins in the Machine: I Watched ChatGPT Get Weird, and OpenAI Finally Explained Why

The first time I saw it, I laughed.

I was debugging some code and ChatGPT told me there was “a little goblin in the system” messing with my loop. Cute. Human-ish. I screenshotted it.

The second time was in a totally different thread, about a marketing plan. “Looks like a gremlin got into your funnel.” Okay, weird coincidence.

The tenth time, it stopped being cute. It was a pattern.

Last week OpenAI finally published the backstory in a post titled [*“Where the goblins came from.”*](https://openai.com/index/where-the-goblins-came-from/) And it turns out this wasn’t a quirky Easter egg. It was a live case study in how AI actually learns.

---

## It Wasn’t Random. OpenAI Measured It.

This is the part that made me sit up. OpenAI didn’t just notice the jokes anecdotally, they plotted them.

After the GPT‑5.1 launch in November, usage of “goblin” in ChatGPT responses rose by **175%**. “Gremlin” rose by **52%**.

![Frequency of “goblin” and “gremlin” in production ChatGPT responses (Aug 2025–Apr 2026)](./images/chart-1-goblin-gremlin-frequency.avif)

*Mentions per million responses: a long flat baseline, a hockey stick after GPT‑5.1, and another lift around GPT‑5.4 — the curve OpenAI published.*

Once you see the curve, you can’t unsee it. This wasn’t one model having a bad day. It was a behavioral drift spreading across versions.

---

## The Culprit Wasn’t a Bug. It Was a Personality.

Here’s where it gets interesting, and where OpenAI deserves credit for being transparent.

The goblins didn’t come from the base model. They came from the **“Nerdy” personality** in ChatGPT’s customization feature.

That personality was literally prompted to be “unapologetically nerdy, playful and wise… You must undercut pretension through playful use of language.”

During reinforcement learning, the reward model that scored “Nerdy” responses consistently gave higher scores to outputs with creature metaphors. In **76.2%** of datasets, an answer with “goblin” or “gremlin” beat the same answer without.

The model learned fast: playful equals creatures.

And here’s the kicker: Nerdy was only **2.5%** of all ChatGPT traffic, but it produced **66.7%** of all goblin mentions.

![Goblin and gremlin share concentrated in the Nerdy personality around GPT‑5.4](./images/chart-2-goblin-by-personality.avif)

*OpenAI’s breakdown: creature metaphors spiked in Nerdy mode as models moved through GPT‑5.4 — a small traffic slice, an outsized share of the behavior.*

---

## The Hand-Holdy Part: How a Joke Escapes Its Cage

If you’re not deep in RLHF, think of it like this: you give a dog a treat every time it does a cute trick in the living room. Soon the dog does the trick in the kitchen, the park, and at your job interview.

That’s exactly what happened.

OpenAI laid out the feedback loop:

1. Playful style is rewarded  
2. Some rewarded examples contain a distinctive tic (goblins)  
3. The tic appears more often in rollouts  
4. Those rollouts are reused for supervised fine-tuning  
5. The model gets even more comfortable producing the tic  

The reward was only applied in Nerdy mode, but RL doesn’t respect boundaries. Once the model learned “goblin = good,” it started using it everywhere, even with no personality selected. As goblins rose in Nerdy, they rose by the same proportion outside it.

This is called **reward generalization**, and it’s why alignment is hard. You don’t train for goblins. You train for “engaging,” and goblins come along for the ride.

---

## Why You Notice It More in Agents Than in Chat

In a one-off chat, a single goblin is forgettable. In a multi-step agent workflow, it’s a nightmare.

I saw this myself building a research agent. Step 1 calls the model to plan, step 2 to search, step 3 to summarize. If step 1 says “let’s hunt the gremlin in this data,” step 2 will repeat the metaphor to stay consistent, and step 3 will summarize it like it’s fact.

The style compounds. What starts as tone becomes behavior.

![Training conversations with the Nerdy personality: rewarded trajectories skewed toward creature metaphors](./images/chart-3-nerdy-training-rollouts.avif)

*This is the kind of data that leaks outward: playful language gets reinforced, then echoed across later turns — which is exactly how a metaphor can harden into “fact” inside an agent chain.*

This is why OpenAI employees first really panicked in **Codex**, their coding agent. Codex is, by definition, nerdy.

---

## The Fix Was Surprisingly Blunt

OpenAI retired the Nerdy personality in March after GPT‑5.4, removed the goblin-affine reward signal, and filtered creature words out of training data.

But GPT‑5.5 had already started training before they found the root cause. So they did what every engineer does when the model won’t listen: they hard-coded it.

If you look at Codex’s system prompt on GitHub, it literally says:

> Never talk about goblins, gremlins, raccoons, trolls, ogres, pigeons, or other animals or creatures unless it is absolutely and unambiguously relevant to the user’s query.

It’s funny, but it’s also telling. We went from “align with human preferences” to “please stop talking about raccoons.”

---

## What This Actually Tells Us About AI

My takeaway isn’t about fantasy creatures. It’s about three things we keep underestimating:

1. **Models learn what we reward, not what we intend.** We wanted “helpful and natural.” The model heard “people click like on witty metaphors.” Goblins were just the most efficient way to be witty.

2. **Personality is operational risk.** A feature built for 2.5% of users leaked into 100% of the model because training data doesn’t stay in its lane. If you’re shipping customizable tones, you need audit tools for lexical drift, not just safety evals.

3. **Small tics are early warning signals.** A goblin is harmless. But the same mechanism that spreads “gremlin” can spread sycophancy, overconfidence, or subtle political framing. OpenAI said it themselves: this investigation gave them new tools to audit behavior quickly.

AI systems don’t just reflect what we explicitly teach them. They reflect what we **implicitly** reward.

Most of the time that makes them feel alive. Sometimes it makes them obsessed with goblins.

---

## Final Thought

Today it’s goblins. Tomorrow it could be a model that always agrees with you, or always uses the same hedge phrase, or always frames risk in a certain way.

The mechanism won’t change. As models get more adaptive, they’ll keep picking up patterns we never wrote down.

The important part is recognizing when a joke is actually data.
