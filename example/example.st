{!h1}[Example Webpage!]

--{!i}[made using stollen!]--

This webpage is made using stollen.

The name is stollen becuase I stole most of the idea from {!a 
https://git.matthewbutterick.com/mbutterick/pollen}[pollen!].

And because I didn't want to just use {!
	a 
	https://git.matthewbutterick.com/mbutterick/pollen
}
[pollen!] because I didn't want to learn racket. (And I wanted to learn how to make simple compiler)

{!h1}[What is Stollen?!]

Stollen is a simple markup language.

It's syntax is like this

{!code}[
outter text

@{! attribute1 attribute2 attribute3 }[
	body text 
	@{! child_attr1 child_attr2}[child text@!]
@!]

outter text
!]

{!h1}[Why not just use html?!]

There are number of different advantages over using plain html.

{!ul}[

	{!li}[Less Typing!]

	{!li}[Easier to read than plain html!]

	{!li}[More flexible since Stollen document converts to js objects!]
!]

{!h1}[What about markdown?!]

Markdown is fine but I think it lacks flexibility.
