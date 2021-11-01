# verkkokauppacom-availability-checker

Check if one or more products are in stock in [Verkkokauppa.com](https://verkkokauppa.com).

## Usage

```bash
node index.js [options] [arguments (product IDs)]
```

For example:

```bash
node index.js -m cron 45515 75645 14176
```

## Options

- -m mode
  - Available modes
    - default: show output for all items
    - cron: show output only for available items (cron output can be forwarded to email)
