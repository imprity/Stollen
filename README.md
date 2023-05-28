# Stollen

*it's like [pollen](https://git.matthewbutterick.com/mbutterick/pollen) but stolen (and bad)*

It's a simple markup langage that can be compiled(?) to javascript object.

# Syntax
Syntax is like this

```
outer text
{! attribute1 attribute2 attribute3}[
    some text
    {!"child attribute 1" "child attribute 2"}[
        child text
    !]
    other text
!]
other outer text
```

And it will convert this file to javascript objects.

```
//it also has a pointer to it's parent
//but I don't know describe circular relations with JSON
{
    "attributes": [],
    "body": [
        "outer text\n",
        {
            "attributes": [
                "attribute1",
                "attribute2",
                "attribute3"
            ],
            "body": [
                "    some text\n    ",
                {
                    "attributes": [
                        "child attribute 1",
                        "child attribute 2"
                    ],
                    "body": [
                        "        child text\n    "
                    ]
                },
                "\n    other text"
            ]
        },
        "\nother outer text"
    ]
}
```

It preserves whitespaces because that makes it easier to be used for writing documents.

# Escaping

Escape character is `@`. To insert escape character, insert `@@`.

You only need to escape characters that are important in that context.

```
you always have to escpae
@@

in most outer body, you only need to escpae
@{! @!]

{!
    in attributes you only need to escape
    @} @"
}
[
    same as most outer body, you only need to escpae
    @{! @!]
!]
```

# TODO

* a way to add comment
* rigorous testing
* better code